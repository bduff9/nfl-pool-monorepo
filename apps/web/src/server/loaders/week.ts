import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { sql } from "kysely";
import { cookies } from "next/headers";
import { cache } from "react";
import "server-only";

import { getCurrentSession } from "./sessions";

import { MILLISECONDS_IN_SECOND, MINUTES_IN_HOUR, SECONDS_IN_MINUTE } from "@/lib/constants";
import { weekSchema } from "@/lib/zod";

export const getCurrentWeek = cache(async () => {
  const { user } = await getCurrentSession();

  if (!user) {
    throw new Error("Not logged in");
  }

  let week = 0;

  try {
    /**
     * Get next game (first not completed game)
     */
    const nextGame = await db
      .selectFrom("Games")
      .select(["GameWeek", "GameNumber", "GameKickoff"])
      .orderBy(["GameKickoff asc"])
      .where("GameStatus", "<>", "Final")
      .executeTakeFirstOrThrow();

    /**
     * If week was passed in as zero (meaning it is looking for
     * selected week not current week) and the next upcoming game
     * is game 1, see if its within 36 hours of kickoff,
     * otherwise go back to last week so people can view their
     * results.
     */
    if (nextGame.GameNumber === 1) {
      const now = new Date();
      const buffer = new Date(
        nextGame.GameKickoff.getTime() - 36 * MINUTES_IN_HOUR * SECONDS_IN_MINUTE * MILLISECONDS_IN_SECOND,
      );

      if (now < buffer) {
        week = nextGame.GameWeek - 1;
      }
    }

    /**
     * If we still haven't set a week yet by the time we get
     * here, go with next game's week.
     */
    if (!week) {
      week = nextGame.GameWeek;
    }
  } catch (_) {
    /**
     * If the above fails, it's because all games are complete,
     * meaning the season is over.  Just get the highest week
     * number we have and use that.
     */
    week = (await db.selectFrom("Games").select("GameWeek").orderBy(["GameWeek desc"]).executeTakeFirstOrThrow())
      .GameWeek;
  }

  return week;
});

export const getSeasonStatus = cache(async () => {
  const { user } = await getCurrentSession();

  if (!user) {
    throw new Error("Not logged in");
  }

  const { Completed, InProgress, NotStarted } = await db
    .selectFrom("Games")
    .select([
      sql<number>`sum(case when GameStatus = 'Pregame' then 1 else 0 end)`.as("NotStarted"),
      sql<number>`sum(case when GameStatus = 'Final' then 1 else 0 end)`.as("Completed"),
      sql<number>`sum(case when GameStatus not in ('Pregame', 'Final') then 1 else 0 end)`.as("InProgress"),
    ])
    .executeTakeFirstOrThrow();

  if (+Completed + +InProgress === 0) {
    return "Not Started";
  }

  if (+NotStarted + +InProgress === 0) {
    return "Complete";
  }

  return "In Progress";
});

export const getSelectedWeek = cache(async (currentWeek?: number) => {
  const { user } = await getCurrentSession();

  if (!user) {
    throw new Error("Not logged in");
  }

  const cookieStore = await cookies();
  const selectedWeekCookie = cookieStore.get("selectedWeek");
  const selectedWeek = selectedWeekCookie?.value ? Number(selectedWeekCookie.value) : 0;

  if (selectedWeek) {
    return selectedWeek;
  }

  if (currentWeek) {
    return currentWeek;
  }

  return getCurrentWeek();
});

export const getWeekStart = cache(async (week: number) => {
  const { user } = await getCurrentSession();

  if (!user) {
    throw new Error("Not logged in");
  }

  weekSchema.parse(week);

  const { GameKickoff } = await db
    .selectFrom("Games")
    .select("GameKickoff")
    .where("GameWeek", "=", week)
    .orderBy("GameKickoff asc")
    .executeTakeFirstOrThrow();

  return GameKickoff;
});

export const getWeekStatus = cache(async (week: number) => {
  const { user } = await getCurrentSession();

  if (!user) {
    throw new Error("Not logged in");
  }

  weekSchema.parse(week);

  const { Completed, InProgress, NotStarted } = await db
    .selectFrom("Games")
    .select([
      sql<number>`sum(case when GameStatus = 'Pregame' then 1 else 0 end)`.as("NotStarted"),
      sql<number>`sum(case when GameStatus = 'Final' then 1 else 0 end)`.as("Completed"),
      sql<number>`sum(case when GameStatus not in ('Pregame', 'Final') then 1 else 0 end)`.as("InProgress"),
    ])
    .where("GameWeek", "=", week)
    .executeTakeFirstOrThrow();

  if (+Completed + +InProgress === 0) {
    return "Not Started";
  }

  if (+NotStarted + +InProgress === 0) {
    return "Complete";
  }

  return "In Progress";
});
