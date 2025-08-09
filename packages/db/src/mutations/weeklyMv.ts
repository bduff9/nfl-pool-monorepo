import { executeSqlFile } from "@nfl-pool-monorepo/utils/database";

export const updateWeeklyMV = async (week: number): Promise<void> => {
	const query = `
	set @week := ${week};
	set foreign_key_checks = 0;
	lock tables WeeklyMV write, WeeklyMV as W write, WeeklyMV as W2 write, SystemValues read, Picks read, Picks as P read, Games read, Games as G read, Games as G2 read, Games as G3 read, Games as G4 read, Users read, Users as U read, Tiebreakers read, Tiebreakers as T read;
	delete from WeeklyMV where Week = @week;
	insert into WeeklyMV (Week, \`Rank\`, Tied, UserID, TeamName, UserName, PointsEarned, PointsWrong, PointsPossible, PointsTotal, GamesCorrect, GamesWrong, GamesPossible, GamesTotal, GamesMissed, TiebreakerScore, LastScore, TiebreakerIsUnder, TiebreakerDiffAbsolute)
	select G.GameWeek, 0 as \`Rank\`, false as Tied, U.UserID, case when U.UserTeamName is null or U.UserTeamName = '' then concat(U.UserFirstName, '\\'s team') else U.UserTeamName end as TeamName, U.UserName, sum(case when P.TeamID = G.WinnerTeamID then P.PickPoints else 0 end) as PointsEarned, sum(case when P.TeamID <> G.WinnerTeamID and G.WinnerTeamID is not null then P.PickPoints else 0 end) as PointsWrong, max((select (sum(1) * (sum(1) + 1)) DIV 2 from Games G2 where G2.GameWeek = G.GameWeek)) - sum(case when P.TeamID <> G.WinnerTeamID and G.WinnerTeamID is not null then P.PickPoints else 0 end) as PointsPossible, max((select (sum(1) * (sum(1) + 1)) DIV 2 from Games G3 where G3.GameWeek = G.GameWeek)) as PointsTotal, sum(case when P.TeamID = G.WinnerTeamID then 1 else 0 end) as GamesCorrect, sum(case when P.TeamID <> G.WinnerTeamID and G.WinnerTeamID is not null then 1 else 0 end) as GamesWrong, sum(case when P.TeamID = G.WinnerTeamID or G.WinnerTeamID is null then 1 else 0 end) as GamesPossible, sum(1) as GamesTotal, sum(case when G.GameWeek > (select SystemValueValue from SystemValues where SystemValueName = 'PaymentDueWeek') and P.TeamID is null then 1 else 0 end) as GamesMissed, max(T.TiebreakerLastScore) as TiebreakerScore, max((select case when G4.GameStatus = 'Final' then G4.GameHomeScore + G4.GameVisitorScore else null end from Games G4 where G4.GameWeek = G.GameWeek order by G4.GameKickoff desc limit 1)) as LastScore, true as TiebreakerDiff, 0 as TiebreakerDiffAbsolute from Picks P join Games G on P.GameID = G.GameID join Users U on P.UserID = U.UserID join Tiebreakers T on T.UserID = U.UserID and T.TiebreakerWeek = G.GameWeek where G.GameWeek = @week group by U.UserID order by PointsEarned desc, GamesCorrect desc;
	update WeeklyMV set TiebreakerIsUnder = TiebreakerScore <= LastScore, TiebreakerDiffAbsolute = abs(TiebreakerScore - LastScore) where Week = @week and LastScore is not null;
	insert into WeeklyMV (Week, \`Rank\`, Tied, UserID, TeamName, UserName, PointsEarned, PointsWrong, PointsPossible, PointsTotal, GamesCorrect, GamesWrong, GamesPossible, GamesTotal, GamesMissed, TiebreakerScore, LastScore, TiebreakerIsUnder, TiebreakerDiffAbsolute)
	select Week, \`Rank\`, false, UserID, TeamName, UserName, PointsEarned, PointsWrong, PointsPossible, PointsTotal, GamesCorrect, GamesWrong, GamesPossible, GamesTotal, GamesMissed, TiebreakerScore, LastScore, TiebreakerIsUnder, TiebreakerDiffAbsolute from (
										SELECT Week,
													 UserID,
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
													 TiebreakerScore,
													 LastScore,
													 TiebreakerIsUnder,
													 TiebreakerDiffAbsolute,
													 @curRank := if(@prevPoints = PointsEarned and @prevGames = GamesCorrect and (@prevTiebreaker = TiebreakerScore or LastScore is null), @curRank,
																					@playerNumber)      as \`Rank\`,
													 @playerNumber := @playerNumber + 1 as playerNumber,
													 @prevPoints := PointsEarned,
													 @prevGames := W.GamesCorrect,
													 @prevTiebreaker := TiebreakerScore
										from WeeklyMV W,
												 (
														 select @curRank := 0, @prevPoints := null, @prevGames := null, @prevTiebreaker := null, @playerNumber := 1
												 ) r
										where Week = @week
										order by PointsEarned desc, GamesCorrect desc, TiebreakerIsUnder desc, TiebreakerDiffAbsolute asc
								) f;
	delete from WeeklyMV where \`Rank\` = 0 and Week = @week;
	update WeeklyMV W join WeeklyMV W2 on W.Rank = W2.Rank and W.UserID <> W2.UserID and W.Week = W2.Week set W.Tied = true where W.Week = @week;
	update WeeklyMV W join WeeklyMV W2 on W2.PointsEarned > W.PointsPossible and W.Week = W2.Week set W.IsEliminated = true where W.Week = @week;
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
		console.error('Error when populating WeeklyMV', error);
		await executeSqlFile(recoverQuery);
	}
};
