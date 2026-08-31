import { db } from "@nfl-pool-monorepo/db/src/kysely";
import type { Selectable } from "kysely";
import { cacheLife, cacheTag } from "next/cache";
import { cache } from "react";
import "server-only";

import type { OverallMV } from "@nfl-pool-monorepo/db/src";

import { cacheTags } from "@/lib/cacheTags";

import { requireUser } from "./sessions";

export const getOverallMvCount = cache(async (): Promise<number> => {
  await requireUser();

  return getOverallMvCountCached();
});

const getOverallMvCountCached = async (): Promise<number> => {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.overallMv());

  const { count } = await db
    .selectFrom("OverallMV")
    .select(({ fn }) => [fn.countAll<number>().as("count")])
    .executeTakeFirstOrThrow();

  return count;
};

export const getOverallMvTiedCount = cache(async (): Promise<number> => {
  const user = await requireUser();

  const { tied } = await db
    .selectFrom("OverallMV as O1")
    .select(({ fn }) => [fn.countAll<number>().as("tied")])
    .innerJoin("OverallMV as O2", (join) => join.onRef("O1.UserID", "<>", "O2.UserID").onRef("O1.Rank", "=", "O2.Rank"))
    .where("O1.UserID", "=", user.id)
    .executeTakeFirstOrThrow();

  return tied;
});

export const getMyOverallRank = cache(async (): Promise<Selectable<OverallMV> | undefined> => {
  const user = await requireUser();

  return db.selectFrom("OverallMV").selectAll().where("UserID", "=", user.id).executeTakeFirst();
});

export const getOverallRankings = cache(async () => {
  await requireUser();

  return getOverallRankingsCached();
});

const getOverallRankingsCached = async () => {
  "use cache";
  cacheLife("minutes");
  cacheTag(cacheTags.overallMv());

  return db.selectFrom("OverallMV").selectAll().orderBy("Rank asc").execute();
};
