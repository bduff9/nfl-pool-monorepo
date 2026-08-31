import { cacheLife, cacheTag } from "next/cache";
import { cache } from "react";
import "server-only";

import { getCurrentWeekInProgress, getGamesForWeek } from "@nfl-pool-monorepo/db/src/queries/game";

import { cacheTags } from "@/lib/cacheTags";

import { requireUser } from "./sessions";

export const getWeekInProgress = cache(() => getCurrentWeekInProgress());

export const getGamesForWeekCached = cache(async (week: number) => {
  await requireUser();

  return getGamesForWeek(week);
});

// Auth is checked by the caller (requireRegistered()) before this is invoked - a 'use cache'
// scope can't call cookies()/requireUser() itself, even transitively.
export const getGamesForWeekScoreboardCached = async (week: number) => {
  "use cache";
  cacheLife("seconds");
  cacheTag(cacheTags.gamesWeek(week));

  return getGamesForWeek(week);
};
