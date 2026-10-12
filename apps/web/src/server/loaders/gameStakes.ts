import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { cache } from "react";
import "server-only";

import { weekSchema } from "@nfl-pool-monorepo/utils/validation";

import { buildGameStakes, type GameStakes, type RidingGame } from "@/lib/riding/stakes";

import { requireUser } from "./sessions";

// Only picks for games that have already kicked off are read: other users' picks are not visible in this app
// before kickoff, so they never leave the database for a game that has not started.
const getStartedPicksForWeek = cache(async (week: number) => {
  weekSchema.assert(week);

  return db
    .selectFrom("Picks as P")
    .innerJoin("Games as G", "G.GameID", "P.GameID")
    .select(["P.GameID", "P.PickPoints", "P.TeamID", "P.UserID"])
    .where("G.GameWeek", "=", week)
    .where("G.GameKickoff", "<=", new Date())
    .execute();
});

/**
 * "What's riding" data for the signed-in user on every started, not-yet-final game of the week. Pass games that
 * already have the live-score overlay applied. Read-only; nothing is written or cached across users.
 */
export const getGameStakes = async (
  week: number,
  games: (RidingGame & { isLiveOverlay?: boolean })[],
): Promise<Record<number, GameStakes>> => {
  const now = new Date();
  const user = await requireUser();

  if (!games.some((game) => game.GameStatus !== "Final" || game.isLiveOverlay)) {
    return {};
  }

  return buildGameStakes(games, await getStartedPicksForWeek(week), user.id, now);
};
