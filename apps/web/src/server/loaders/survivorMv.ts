import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { sql } from "kysely";
import { cache } from "react";
import "server-only";

import { WEEKS_IN_SEASON } from "@nfl-pool-monorepo/utils/constants";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/mysql";

import { getWeekInProgress } from "./game";
import { getCurrentSession } from "./sessions";

export const getMySurvivorMv = cache(async () => {
  const { user } = await getCurrentSession();

  if (!user) {
    throw new Error("Not logged in");
  }

  const result = await db
    .selectFrom("SurvivorMV as S")
    .leftJoin("Teams as T", "T.TeamID", "S.LastPick")
    .select(["S.SurvivorMVID", "T.TeamName", "T.TeamCity", "T.TeamLogo"])
    .where("UserID", "=", user.id)
    .executeTakeFirst();

  if (!result) {
    return null;
  }

  const { TeamName, TeamCity, TeamLogo, ...rest } = result;

  const mySurvivorMV = {
    ...rest,
    lastPickTeam: undefined,
  };

  if (TeamName && TeamCity && TeamLogo) {
    return {
      ...mySurvivorMV,
      lastPickTeam: {
        TeamCity,
        TeamLogo,
        TeamName,
      },
    };
  }

  return mySurvivorMV;
});

export const getSurvivorOverallCounts = cache(async () => {
  const { user } = await getCurrentSession();

  if (!user) {
    throw new Error("Not logged in");
  }

  const result = await db
    .selectFrom("SurvivorMV")
    .select(({ fn }) => [
      fn.sum<number>(sql`1`).as("overallCount"),
      fn.sum<number>(sql`CASE WHEN IsAliveOverall = 1 THEN 1 ELSE 0 END`).as("aliveCount"),
      fn.sum<number>(sql`CASE WHEN IsAliveOverall = 0 THEN 1 ELSE 0 END`).as("deadCount"),
    ])
    .executeTakeFirst();

  return (
    result ?? {
      aliveCount: 0,
      deadCount: 0,
      overallCount: 0,
    }
  );
});

export const getSurvivorRankings = cache(async () => {
  const weekInProgress = await getWeekInProgress();

  return db
    .selectFrom("SurvivorMV as smv")
    .select(({ selectFrom }) => [
      "smv.UserID",
      "smv.UserName",
      "smv.TeamName",
      "smv.IsAliveOverall",
      jsonArrayFrom(
        selectFrom("SurvivorPicks as sp")
          .innerJoin("Games as g", "g.GameID", "sp.GameID")
          .leftJoin("Teams as t", "t.TeamID", "sp.TeamID")
          .select(["sp.SurvivorPickWeek", "g.WinnerTeamID", "t.TeamID", "t.TeamCity", "t.TeamName", "t.TeamLogo"])
          .where("sp.SurvivorPickWeek", "<=", weekInProgress)
          .where("sp.SurvivorPickDeleted", "is", null)
          .whereRef("sp.UserID", "=", "smv.UserID")
          .orderBy("sp.SurvivorPickWeek", "asc"),
      ).as("allPicks"),
    ])
    .orderBy("Rank", "asc")
    .execute();
});

export const getSurvivorStatus = cache(async () => {
  const { user } = await getCurrentSession();

  if (!user) {
    throw new Error("Not logged in");
  }

  const { count } = await db
    .selectFrom("SurvivorMV")
    .select(({ fn }) => [fn.countAll<number>().as("count")])
    .executeTakeFirstOrThrow();

  if (count === 0) {
    return "Not Started";
  }

  const alive = await db.selectFrom("SurvivorMV").select("WeeksAlive").where("IsAliveOverall", "=", 1).execute();

  if (alive.length < 2 || alive[0]?.WeeksAlive === WEEKS_IN_SEASON) {
    return "Complete";
  }

  return "In Progress";
});

export const getSurvivorWeeklyCounts = cache(async (week: number) => {
  const { user } = await getCurrentSession();

  if (!user) {
    throw new Error("Not logged in");
  }

  const maxResult = await db
    .selectFrom("SurvivorMV")
    .select(({ fn }) => [fn.max("WeeksAlive").as("max")])
    .executeTakeFirst();
  const maxWeek = maxResult?.max ?? 0;
  const deadSql =
    week < maxWeek
      ? sql`CASE WHEN WeeksAlive = ${week} THEN 1 ELSE 0 END`
      : sql`CASE WHEN CurrentStatus = 'Dead' THEN 1 ELSE 0 END`;
  const result = await db
    .selectFrom("SurvivorMV")
    .select(({ fn }) => [
      fn.sum<number>(sql`1`).as("overallCount"),
      fn.sum<number>(sql`CASE WHEN WeeksAlive > ${week} OR CurrentStatus = 'Alive' THEN 1 ELSE 0 END`).as("aliveCount"),
      fn.sum<number>(deadSql).as("deadCount"),
      fn.sum<number>(sql`CASE WHEN CurrentStatus = 'Waiting' THEN 1 ELSE 0 END`).as("waitingCount"),
    ])
    .where("WeeksAlive", ">=", week)
    .executeTakeFirst();

  return (
    result ?? {
      aliveCount: 0,
      deadCount: 0,
      overallCount: 0,
      waitingCount: 0,
    }
  );
});
