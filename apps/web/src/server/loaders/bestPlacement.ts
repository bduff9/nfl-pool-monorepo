import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { cacheLife, cacheTag } from "next/cache";
import { cache } from "react";
import "server-only";

import { cacheTags } from "@/lib/cacheTags";

import { requireUser } from "./sessions";

export type MyBestPlacementOverall = {
  bestRank: null | number;
  canAchieveFirst: boolean;
  canAchieveThird: boolean;
  canAchieveSecond: boolean;
  scenarioCount: number;
  undecidedGamesAtCalc: number;
};

export type MyBestPlacementWeekly = {
  bestRank: null | number;
  canAchieveFirst: boolean;
  canAchieveSecond: boolean;
  pointsBack: null | number;
  scenarioCount: number;
  undecidedGamesAtCalc: number;
};

export const getMyBestPlacementOverall = cache(async (): Promise<MyBestPlacementOverall | null> => {
  const user = await requireUser();

  return getMyBestPlacementOverallCached(user.id);
});

const getMyBestPlacementOverallCached = async (userID: number) => {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.overallMv());

  const row = await db
    .selectFrom("BestPlacementOverall")
    .select([
      "BestRank",
      "CanAchieveFirst",
      "CanAchieveSecond",
      "CanAchieveThird",
      "ScenarioCount",
      "UndecidedGamesAtCalc",
    ])
    .where("UserID", "=", userID)
    .executeTakeFirst();

  if (!row) {
    return null;
  }

  return {
    bestRank: row.BestRank,
    canAchieveFirst: row.CanAchieveFirst === 1,
    canAchieveSecond: row.CanAchieveSecond === 1,
    canAchieveThird: row.CanAchieveThird === 1,
    scenarioCount: row.ScenarioCount,
    undecidedGamesAtCalc: row.UndecidedGamesAtCalc,
  };
};

export const getMyBestPlacementWeekly = cache(async (week: number): Promise<MyBestPlacementWeekly | null> => {
  const user = await requireUser();

  return getMyBestPlacementWeeklyCached(week, user.id);
});

// fallow-ignore-next-line complexity -- single cached query plus leader-points lookup; branches map table flags to booleans
const getMyBestPlacementWeeklyCached = async (week: number, userID: number) => {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.weeklyMv(week));

  // BestPlacementWeekly tracks First/Second only; the overall table also has Third.
  const row = await db
    .selectFrom("BestPlacementWeekly")
    .select(["BestRank", "CanAchieveFirst", "CanAchieveSecond", "ScenarioCount", "UndecidedGamesAtCalc"])
    .where("Week", "=", week)
    .where("UserID", "=", userID)
    .executeTakeFirst();

  if (!row) {
    return null;
  }

  // Points back to the weekly leader, so the panel can say how reachable a win is.
  const [leaderRow, myPointsResult] = await Promise.all([
    db
      .selectFrom("WeeklyMV")
      .select(({ fn }) => [fn.max("PointsEarned").as("leaderPoints")])
      .where("Week", "=", week)
      .executeTakeFirstOrThrow(),
    db
      .selectFrom("WeeklyMV")
      .select("PointsEarned")
      .where("Week", "=", week)
      .where("UserID", "=", userID)
      .executeTakeFirst(),
  ]);

  return {
    bestRank: row.BestRank,
    canAchieveFirst: row.CanAchieveFirst === 1,
    canAchieveSecond: row.CanAchieveSecond === 1,
    pointsBack: (leaderRow?.leaderPoints ?? 0) - (myPointsResult?.PointsEarned ?? 0),
    scenarioCount: row.ScenarioCount,
    undecidedGamesAtCalc: row.UndecidedGamesAtCalc,
  };
};
