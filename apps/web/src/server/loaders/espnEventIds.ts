import { cacheLife } from "next/cache";
import "server-only";

import { type EspnEventIdMap, parseEspnEventIds } from "@/lib/liveScores/espnEventIds";

const ESPN_SCOREBOARD_URL = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";
const ESPN_TIMEOUT_MS = 3000;
const REGULAR_SEASON = 2;

// Event ids for a week's games never change, so this is cached for hours. ESPN is display-only: nothing from it is
// ever written to the database. A failed fetch is cached as an empty map (no links) rather than retried per viewer.
// Our weeks map 1:1 to ESPN regular-season weeks; `dates` is the season year, which ESPN needs for past weeks.
export const getEspnEventIds = async (week: number, seasonYear: number): Promise<EspnEventIdMap> => {
  "use cache";
  cacheLife({ expire: 86_400, revalidate: 3600, stale: 3600 });

  try {
    const url = `${ESPN_SCOREBOARD_URL}?week=${week}&seasontype=${REGULAR_SEASON}&dates=${seasonYear}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(ESPN_TIMEOUT_MS) });

    if (!response.ok) {
      throw new Error(`ESPN scoreboard responded with ${response.status}`);
    }

    return parseEspnEventIds(await response.json());
  } catch (error) {
    console.error("ESPN event ids unavailable, finished games will not link to game details", error);

    return {};
  }
};
