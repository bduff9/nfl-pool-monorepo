import type { Kysely } from "kysely";

import type { DB } from "..";

export const weeklyScoresThroughQuery = (db: Kysely<DB>, week: number) =>
  db.selectFrom("WeeklyMV").select(["UserID", "UserName", "Week", "Rank", "PointsEarned"]).where("Week", "<=", week);

export const finalGameWinnersQuery = (db: Kysely<DB>, week: number) =>
  db
    .selectFrom("Games as g")
    .innerJoin("Teams as t", "t.TeamID", "g.WinnerTeamID")
    .select(["g.GameID", "g.WinnerTeamID", "t.TeamCity", "t.TeamName"])
    .where("g.GameWeek", "=", week)
    .where("g.GameDeleted", "is", null)
    .where("g.GameStatus", "=", "Final");

export const pickCountsQuery = (db: Kysely<DB>, week: number) =>
  db
    .selectFrom("Picks as p")
    .innerJoin("Games as g", "g.GameID", "p.GameID")
    .select(["p.GameID", "p.TeamID"])
    .select(({ fn }) => fn.countAll<number>().as("picks"))
    .where("g.GameWeek", "=", week)
    .where("g.GameDeleted", "is", null)
    .where("p.PickDeleted", "is", null)
    .where("p.TeamID", "is not", null)
    .groupBy(["p.GameID", "p.TeamID"]);

export const correctPicksQuery = (db: Kysely<DB>, week: number) =>
  db
    .selectFrom("Picks as p")
    .innerJoin("Games as g", (join) => join.onRef("g.GameID", "=", "p.GameID").onRef("g.WinnerTeamID", "=", "p.TeamID"))
    .innerJoin("Teams as t", "t.TeamID", "p.TeamID")
    .innerJoin("Users as u", "u.UserID", "p.UserID")
    .select(["p.PickPoints", "t.TeamCity", "t.TeamName", "u.UserFirstName", "u.UserLastName"])
    .where("g.GameWeek", "=", week)
    .where("g.GameDeleted", "is", null)
    .where("p.PickDeleted", "is", null)
    .where("p.PickPoints", "is not", null);
