import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { getSurvivorMvCount } from "@nfl-pool-monorepo/db/src/queries/survivor";
import { sql } from "kysely";
import { cache } from "react";
import "server-only";

import { jsonArrayFrom } from "kysely/helpers/mysql";

import { getWeekInProgress } from "./game";
import { requireUser } from "./sessions";
import { deadCountSql, isSurvivorComplete, toLastPickTeam, toMaxWeek } from "./survivorMvHelpers";

export const getMySurvivorMv = cache(async () => {
  const user = await requireUser();

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

  return {
    ...rest,
    lastPickTeam: toLastPickTeam({ TeamCity, TeamLogo, TeamName }),
  };
});

export const getSurvivorOverallCounts = cache(async () => {
  await requireUser();

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
  await requireUser();

  const count = await getSurvivorMvCount();

  if (count === 0) {
    return "Not Started";
  }

  const alive = await db.selectFrom("SurvivorMV").select("WeeksAlive").where("IsAliveOverall", "=", 1).execute();

  return isSurvivorComplete(alive) ? "Complete" : "In Progress";
});

export const getSurvivorWeeklyCounts = cache(async (week: number) => {
  await requireUser();

  const maxResult = await db
    .selectFrom("SurvivorMV")
    .select(({ fn }) => [fn.max("WeeksAlive").as("max")])
    .executeTakeFirst();
  const deadSql = deadCountSql(week, toMaxWeek(maxResult));
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
