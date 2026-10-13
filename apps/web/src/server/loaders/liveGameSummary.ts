import { cacheLife } from "next/cache";
import "server-only";

import { type LiveGameSummary, parseEspnSummary } from "@/lib/liveGame/espnSummary";

const ESPN_SUMMARY_URL = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary";
const ESPN_TIMEOUT_MS = 4000;

/**
 * Play-by-play for one game from ESPN's unofficial summary endpoint (display-only, never written to the database).
 * Cached ~10s per event so every viewer polling a live game (every 5s) shares one upstream request per 10s; the
 * payload is large (~700KB), so the cache keeps the parsed result only. Returns null instead of throwing when ESPN
 * is unreachable or responds badly, which the page renders as an "unavailable" state.
 */
export const getLiveGameSummary = async (eventId: string): Promise<LiveGameSummary | null> => {
  "use cache";
  cacheLife({ expire: 20, revalidate: 10, stale: 10 });

  try {
    const response = await fetch(`${ESPN_SUMMARY_URL}?event=${encodeURIComponent(eventId)}`, {
      signal: AbortSignal.timeout(ESPN_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`ESPN summary responded with ${response.status}`);
    }

    return parseEspnSummary(await response.json());
  } catch (error) {
    console.error(`Live game details unavailable for ESPN event ${eventId}`, error);

    return null;
  }
};

/** Poll while the game is live, and also when the summary is unavailable so one failed fetch doesn't freeze it. */
export const shouldPollSummary = (summary: LiveGameSummary | null): boolean =>
  summary === null || summary.header?.state === "in";
