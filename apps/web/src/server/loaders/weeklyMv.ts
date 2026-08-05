import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { cache } from "react";
import "server-only";

import { weekSchema } from "@nfl-pool-monorepo/utils/validation";

import { requireUser } from "./sessions";

export const getWeeklyMvCount = cache(async (week: number) => {
  weekSchema.assert(week);

  const { count } = await db
    .selectFrom("WeeklyMV")
    .select(({ fn }) => [fn.countAll<number>().as("count")])
    .where("Week", "=", week)
    .executeTakeFirstOrThrow();

  return count;
});

export const getWeeklyMvTiedCount = cache(async (week: number) => {
  const user = await requireUser();

  weekSchema.assert(week);

  const { tied } = await db
    .selectFrom("WeeklyMV as W1")
    .select(({ fn }) => [fn.countAll<number>().as("tied")])
    .innerJoin("WeeklyMV as W2", (join) =>
      join.onRef("W1.UserID", "<>", "W2.UserID").onRef("W1.Rank", "=", "W2.Rank").onRef("W1.Week", "=", "W2.Week"),
    )
    .where("W1.UserID", "=", user.id)
    .where("W1.Week", "=", week)
    .executeTakeFirstOrThrow();

  return tied;
});

export const getMyWeeklyRank = cache(async (week: number) => {
  const user = await requireUser();

  weekSchema.assert(week);

  return db
    .selectFrom("WeeklyMV")
    .selectAll()
    .where("Week", "=", week)
    .where("UserID", "=", user.id)
    .executeTakeFirst();
});

export const getWeeklyRankings = cache((week: number) => {
  weekSchema.assert(week);

  return db.selectFrom("WeeklyMV").selectAll().where("Week", "=", week).orderBy("Rank asc").execute();
});
