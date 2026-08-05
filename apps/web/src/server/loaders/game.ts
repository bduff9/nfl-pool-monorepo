import { cache } from "react";
import "server-only";

import { getCurrentWeekInProgress, getGamesForWeek } from "@nfl-pool-monorepo/db/src/queries/game";

import { requireUser } from "./sessions";

export const getWeekInProgress = cache(() => getCurrentWeekInProgress());

export const getGamesForWeekCached = cache(async (week: number) => {
  await requireUser();

  return getGamesForWeek(week);
});
