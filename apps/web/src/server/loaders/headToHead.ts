import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { jsonObjectFrom } from "kysely/helpers/mysql";
import { cache } from "react";
import "server-only";

import { weekSchema } from "@nfl-pool-monorepo/utils/validation";

const getHeadToHeadGames = cache(async (week: number) => {
  weekSchema.assert(week);

  return db
    .selectFrom("Games as G")
    .selectAll("G")
    .select((eb) => [
      jsonObjectFrom(
        eb
          .selectFrom("Teams as HT")
          .select(["HT.TeamID", "HT.TeamCity", "HT.TeamLogo", "HT.TeamName"])
          .whereRef("HT.TeamID", "=", "G.HomeTeamID"),
      ).as("homeTeam"),
      jsonObjectFrom(
        eb
          .selectFrom("Teams as VT")
          .select(["VT.TeamID", "VT.TeamCity", "VT.TeamLogo", "VT.TeamName"])
          .whereRef("VT.TeamID", "=", "G.VisitorTeamID"),
      ).as("visitorTeam"),
    ])
    .where("G.GameWeek", "=", week)
    .orderBy("G.GameKickoff asc")
    .execute();
});

const getPicksForUser = cache(async (week: number, userID: number) => {
  weekSchema.assert(week);

  const picks = await db
    .selectFrom("Picks")
    .select(["GameID", "TeamID", "PickPoints"])
    .where("UserID", "=", userID)
    .where("PickDeleted", "is", null)
    .execute();

  return new Map(picks.map((pick) => [pick.GameID, pick]));
});

const getWeeklyRank = cache(async (week: number, userID: number) => {
  weekSchema.assert(week);

  return db
    .selectFrom("WeeklyMV")
    .select(["Rank", "TeamName", "PointsEarned", "GamesCorrect"])
    .where("Week", "=", week)
    .where("UserID", "=", userID)
    .executeTakeFirst();
});

export const getHeadToHead = cache(async (week: number, userAID: number, userBID: number) => {
  const [games, picksA, picksB, rankA, rankB] = await Promise.all([
    getHeadToHeadGames(week),
    getPicksForUser(week, userAID),
    getPicksForUser(week, userBID),
    getWeeklyRank(week, userAID),
    getWeeklyRank(week, userBID),
  ]);

  return { games, picksA, picksB, rankA, rankB };
});
