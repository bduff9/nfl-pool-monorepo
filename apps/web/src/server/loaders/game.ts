import { cache } from "react";
import "server-only";

import { getCurrentWeekInProgress, getGamesForWeek } from "@nfl-pool-monorepo/db/src/queries/game";

import { getCurrentSession } from "./sessions";

export const getWeekInProgress = cache(() => getCurrentWeekInProgress());

export const getGamesForWeekCached = cache(async (week: number) => {
  const { user } = await getCurrentSession();

  if (!user) {
    throw new Error("Not logged in");
  }

  return getGamesForWeek(week);
});
