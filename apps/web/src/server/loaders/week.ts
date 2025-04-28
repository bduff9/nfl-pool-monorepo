import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { getCurrentWeek } from "@nfl-pool-monorepo/db/src/queries/week";
import { sql } from "kysely";
import { cookies } from "next/headers";
import { cache } from "react";
import "server-only";

import { weekSchema } from "@/lib/zod";
import { getCurrentSession } from "./sessions";

export const getCurrentWeekCached = cache(() => getCurrentWeek());

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

  if (Number(Completed) + Number(InProgress) === 0) {
    return "Not Started";
  }

  if (Number(NotStarted) + Number(InProgress) === 0) {
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

  return getCurrentWeekCached();
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

  if (Number(Completed) + Number(InProgress) === 0) {
    return "Not Started";
  }

  if (Number(NotStarted) + Number(InProgress) === 0) {
    return "Complete";
  }

  return "In Progress";
});
