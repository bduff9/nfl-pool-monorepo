import { executeSqlFile } from "@nfl-pool-monorepo/utils/database";

export const updateOverallMV = async (week: number): Promise<void> => {
  const query = `
	set @week := ${week};
	set foreign_key_checks = 0;
	lock tables OverallMV write, OverallMV as O write, OverallMV as O2 write, SystemValues read, Picks read, Picks as P read, Games read, Games as G read, Games as G2 read, Games as G3 read, Users read, Users as U read;
	delete from OverallMV;
	insert into OverallMV (\`Rank\`, Tied, UserID, TeamName, UserName, PointsEarned, PointsWrong, PointsPossible, PointsTotal, GamesCorrect, GamesWrong, GamesPossible, GamesTotal, GamesMissed)
		select 0 as \`Rank\`, false as Tied, U.UserID, case when U.UserTeamName is null or U.UserTeamName = '' then concat(U.UserFirstName, '\\'s team') else U.UserTeamName end as TeamName, U.UserName, sum(case when P.TeamID = G.WinnerTeamID then P.PickPoints else 0 end) as PointsEarned, sum(case when P.TeamID <> G.WinnerTeamID and G.WinnerTeamID is not null then P.PickPoints else 0 end) as PointsWrong, max((select sum(i.weekTotalPoints) from (select G2.GameWeek, (sum(1) * (sum(1) + 1)) DIV 2 as weekTotalPoints from Games G2 group by G2.GameWeek) i where i.GameWeek <= @week)) - sum(case when P.TeamID <> G.WinnerTeamID and G.WinnerTeamID is not null then P.PickPoints else 0 end) as PointsPossible, max((select sum(i.weekTotalPoints) from (select G3.GameWeek, (sum(1) * (sum(1) + 1)) DIV 2 as weekTotalPoints from Games G3 group by G3.GameWeek) i where i.GameWeek <= @week)) as PointsTotal, sum(case when P.TeamID = G.WinnerTeamID then 1 else 0 end) as GamesCorrect, sum(case when P.TeamID <> G.WinnerTeamID and G.WinnerTeamID is not null then 1 else 0 end) as GamesWrong, sum(case when P.TeamID = G.WinnerTeamID or G.WinnerTeamID is null then 1 else 0 end) as GamesPossible, sum(1) as GamesTotal, sum(case when G.GameWeek > (select SystemValueValue from SystemValues where SystemValueName = 'PaymentDueWeek') and P.TeamID is null then 1 else 0 end) as GamesMissed from Picks P join Games G on P.GameID = G.GameID join Users U on P.UserID = U.UserID where G.GameWeek <= @week group by U.UserID order by PointsEarned desc, GamesCorrect desc;
	insert into OverallMV (\`Rank\`, Tied, UserID, TeamName, UserName, PointsEarned, PointsWrong, PointsPossible, PointsTotal, GamesCorrect, GamesWrong, GamesPossible, GamesTotal, GamesMissed)
		select \`Rank\`, false, UserID, TeamName, UserName, PointsEarned, PointsWrong, PointsPossible, PointsTotal, GamesCorrect, GamesWrong, GamesPossible, GamesTotal, GamesMissed from (
											SELECT UserID,
														 TeamName,
														 UserName,
														 PointsEarned,
														 PointsWrong,
														 PointsPossible,
														 PointsTotal,
														 GamesCorrect,
														 GamesWrong,
														 GamesPossible,
														 GamesTotal,
														 GamesMissed,
														 @curRank := if(@prevPoints = PointsEarned and @prevGames = GamesCorrect, @curRank,
																						@playerNumber)      as \`Rank\`,
														 @playerNumber := @playerNumber + 1 as playerNumber,
														 @prevPoints := PointsEarned,
														 @prevGames := O.GamesCorrect
											from OverallMV O,
													 (
															 select @curRank := 0, @prevPoints := null, @prevGames := null, @playerNumber := 1
													 ) r
											ORDER BY PointsEarned desc, GamesCorrect desc
									) f;
	delete from OverallMV where \`Rank\` = 0;
	update OverallMV O join OverallMV O2 on O.Rank = O2.Rank and O.UserID <> O2.UserID set O.Tied = true;
	update OverallMV O join OverallMV O2 on O2.PointsEarned > O.PointsPossible set O.IsEliminated = true;
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
    console.error("Error when populating OverallMV: ", error);
    await executeSqlFile(recoverQuery);
  }
};
