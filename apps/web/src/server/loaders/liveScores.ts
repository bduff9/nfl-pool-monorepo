import { cacheLife } from "next/cache";
import "server-only";

import {
  applyLiveScores,
  isLiveCandidate,
  type OverlayableGame,
  type WithLiveFlag,
} from "@/lib/liveScores/applyLiveScores";
import { type LiveScoreMap, parseEspnScoreboard } from "@/lib/liveScores/parseEspn";

const ESPN_SCOREBOARD_URL = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";
const ESPN_TIMEOUT_MS = 3000;

// ESPN's endpoint is unofficial and display-only: nothing from it is ever written to the database.
// A ~5s shared cache means every viewer polling the scoreboard (every 5s) shares one upstream ESPN request per 5s,
// and a failed fetch (cached as an empty map) is not retried against ESPN by every viewer. Stale-while-revalidate is
// capped by `expire` so a live score is never older than ~10s. ESPN itself serves max-age=10.
const getEspnLiveScores = async (): Promise<LiveScoreMap> => {
  "use cache";
  cacheLife({ expire: 10, revalidate: 5, stale: 5 });

  try {
    const response = await fetch(ESPN_SCOREBOARD_URL, { signal: AbortSignal.timeout(ESPN_TIMEOUT_MS) });

    if (!response.ok) {
      throw new Error(`ESPN scoreboard responded with ${response.status}`);
    }

    return parseEspnScoreboard(await response.json());
  } catch (error) {
    console.error("Live score overlay unavailable, falling back to official data", error);

    return {};
  }
};

/**
 * Reusable live-score overlay for any feature that renders games.
 *
 * Takes games shaped like OverlayableGame (the scoreboard's game rows qualify) and returns them with an
 * `isLiveOverlay` flag. For games the database considers live (in progress, or kicked off and not yet final),
 * the score, quarter/half/overtime status and clock come from ESPN when a match exists and possession is cleared.
 * All other games, and every game if ESPN is unreachable or malformed, are returned unchanged with
 * `isLiveOverlay: false`. Never throws. ESPN is only contacted when at least one game is a live candidate.
 */
export const getLiveScoreOverlay = async <T extends OverlayableGame>(games: T[]): Promise<WithLiveFlag<T>[]> => {
  const now = new Date();
  const liveScores = games.some((game) => isLiveCandidate(game, now)) ? await getEspnLiveScores() : {};

  return applyLiveScores(games, liveScores, now);
};
