import { type EspnGame, type EspnSummary, parseEspnScoreboard, parseEspnSummary } from "./parse";

const ESPN_BASE_URL = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";
const ESPN_TIMEOUT_MS = 5000;

const getEspnJson = async (url: string): Promise<unknown> => {
  const response = await fetch(url, { signal: AbortSignal.timeout(ESPN_TIMEOUT_MS) });

  if (!response.ok) {
    throw new Error(`ESPN request failed with status ${response.status}: ${url}`);
  }

  return response.json();
};

/** The live and finished games on ESPN's scoreboard. Throws when ESPN is slow or unavailable. */
export const fetchEspnLiveGames = async (): Promise<EspnGame[]> =>
  parseEspnScoreboard(await getEspnJson(`${ESPN_BASE_URL}/scoreboard`));

/** The scoring plays of one ESPN event. Throws when ESPN is slow or unavailable. */
export const fetchEspnSummary = async (eventId: string): Promise<EspnSummary> =>
  parseEspnSummary(await getEspnJson(`${ESPN_BASE_URL}/summary?event=${encodeURIComponent(eventId)}`));
