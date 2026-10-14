import { getSystemYear } from "@nfl-pool-monorepo/db/src/queries/systemValue";
import "server-only";

import type { ScoreboardGame } from "@/components/ScoreboardGameCard/ScoreboardGameCard";
import { attachEventIds, type EventIdGame, hasFinalGame } from "@/lib/liveScores/attachEventIds";
import { getEspnEventIds } from "@/server/loaders/espnEventIds";
import type { getGamesForWeekScoreboardCached } from "@/server/loaders/game";
import { getLiveScoreOverlay } from "@/server/loaders/liveScores";

// Finished games were not overlaid, so look up their ESPN event ids to link to the game page
const getGamesWithEventIds = async <T extends EventIdGame>(games: T[], week: number): Promise<T[]> =>
  hasFinalGame(games) ? attachEventIds(games, await getEspnEventIds(week, await getSystemYear())) : games;

/**
 * A week's games as the scoreboard cards show them: live scores overlaid, and the ESPN event id on every game that
 * has a game page. The scoreboard and the game page both use this, so a game's card looks the same on both.
 */
export const getScoreboardGames = async (
  dbGames: Awaited<ReturnType<typeof getGamesForWeekScoreboardCached>>,
  week: number,
): Promise<ScoreboardGame[]> => getGamesWithEventIds(await getLiveScoreOverlay(dbGames), week);
