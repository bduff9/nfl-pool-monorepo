import { db as database } from "../kysely";
import { correctPicksQuery, finalGameWinnersQuery, pickCountsQuery, weeklyScoresThroughQuery } from "./recapHelpers";

// The most points anyone put on a single pick that turned out correct, ties included
export const getPickOfTheWeek = async (week: number) => {
  const [top] = await correctPicksQuery(database, week).orderBy("p.PickPoints", "desc").limit(1).execute();

  if (!top?.PickPoints) {
    return [];
  }

  return correctPicksQuery(database, week).where("p.PickPoints", "=", top.PickPoints).execute();
};

export const getWeeklyScoresThrough = (week: number) => weeklyScoresThroughQuery(database, week).execute();

export const getFinalGameWinners = (week: number) => finalGameWinnersQuery(database, week).execute();

export const getPickCounts = (week: number) => pickCountsQuery(database, week).execute();

export const getUserWeeklyResult = (userId: number, week: number) =>
  database
    .selectFrom("WeeklyMV")
    .select(["Rank", "PointsEarned"])
    .where("Week", "=", week)
    .where("UserID", "=", userId)
    .executeTakeFirst();
