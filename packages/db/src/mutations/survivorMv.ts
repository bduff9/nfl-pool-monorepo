import { executeSqlFile } from "@nfl-pool-monorepo/utils/database";

export const updateSurvivorMV = async (week: number): Promise<void> => {
  const query = `
	set @week := ${week};
	set foreign_key_checks = 0;
	lock tables SurvivorMV write, SurvivorMV as S1 write, SurvivorMV as S2 write, Games read, Games as G read, SurvivorPicks read, SurvivorPicks as S read, SurvivorPicks as SP read, SurvivorPicks as SP2 read, Users read, Users as U read;
	delete from SurvivorMV;
	insert into SurvivorMV (\`Rank\`, Tied, UserID, UserName, TeamName, WeeksAlive, IsAliveOverall, CurrentStatus, LastPick)
		select 0 as \`Rank\`, false as Tied, U.UserID, U.UserName, case when U.UserTeamName is null or U.UserTeamName = '' then concat(U.UserFirstName, '\\'s team') else U.UserTeamName end as TeamName, (select count(*) from SurvivorPicks SP where SP.UserID = S.UserID and SP.SurvivorPickDeleted is null and SP.SurvivorPickWeek <= @week) as WeeksAlive, case when S.SurvivorPickDeleted is not null then false when S.TeamID is null then false when S.TeamID = G.WinnerTeamID or G.WinnerTeamID is null then true else false end as IsAliveOverall, case when S.SurvivorPickDeleted is not null then null when S.TeamID is null then 'Dead' when G.WinnerTeamID is null then 'Waiting' when S.TeamID = G.WinnerTeamID then 'Alive' else 'Dead' end as CurrentStatus, (select TeamID from SurvivorPicks SP2 where SP2.UserID = S.UserID and SP2.SurvivorPickWeek <= @week and SP2.SurvivorPickDeleted is null order by SP2.SurvivorPickWeek desc limit 1) as LastPick from SurvivorPicks S join Games G on S.GameID = G.GameID join Users U on S.UserID = U.UserID where S.SurvivorPickWeek = @week order by IsAliveOverall desc, WeeksAlive desc;
	insert into SurvivorMV (\`Rank\`, Tied, UserID, TeamName, UserName, WeeksAlive, IsAliveOverall, CurrentStatus, LastPick)
		select \`Rank\`, false, UserID, TeamName, UserName, WeeksAlive, IsAliveOverall, CurrentStatus, LastPick from (
				select UserID,
						TeamName,
						UserName,
						WeeksAlive,
						IsAliveOverall,
						CurrentStatus,
						LastPick,
						@curRank := if(@prevIsAlive = IsAliveOverall and @prevWeeksAlive = WeeksAlive, @curRank, @playerNumber) as \`Rank\`,
						@playerNumber := @playerNumber + 1 as playerNumber,
						@prevIsAlive := isAliveOverall,
						@prevWeeksAlive := WeeksAlive
				from SurvivorMV S1,
				(
						select @curRank := 0, @prevIsAlive := null, @prevWeeksAlive := null, @playerNumber := 1
				) r
				order by IsAliveOverall desc, WeeksAlive desc
			) f;
	delete from SurvivorMV where \`Rank\` = 0;
	update SurvivorMV S1 join SurvivorMV S2 on S1.Rank = S2.Rank and S1.UserID <> S2.UserID set S1.Tied = true;
	unlock tables;
	set foreign_key_checks = 1;
`;
  const recoverQuery = `
	unlock tables;
	set foreign_key_checks = 1;
`;

  try {
    await executeSqlFile(query);
  } catch (error) {
    console.error("Error when populating SurvivorMV: ", error);
    await executeSqlFile(recoverQuery);
  }
};
