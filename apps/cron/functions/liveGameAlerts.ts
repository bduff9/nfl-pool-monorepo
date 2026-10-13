import { fetchEspnLiveGames, fetchEspnSummary } from "@nfl-pool-monorepo/api/src/espn/fetch";
import type { EspnGame } from "@nfl-pool-monorepo/api/src/espn/parse";
import {
  getAliveSurvivorPicks,
  getLiveAlertGames,
  getLiveAlertSubscriberIds,
  getWeekProjectionGames,
  getWeekProjectionPicks,
} from "@nfl-pool-monorepo/db/src/queries/liveAlerts";
import { buildLiveAlerts, buildProjectionGames } from "@nfl-pool-monorepo/transactional/src/liveAlerts/buildAlerts";
import {
  type DbAlertGame,
  matchEspnGames,
  toAlertGame,
} from "@nfl-pool-monorepo/transactional/src/liveAlerts/matchGames";
import { sendLiveAlerts } from "@nfl-pool-monorepo/transactional/src/liveAlerts/sendLiveAlerts";
import type { AlertContext, AlertGame } from "@nfl-pool-monorepo/transactional/src/liveAlerts/types";
import type { Handler } from "aws-lambda";

const getEspnGamesOrNull = async (): Promise<EspnGame[] | null> => {
  try {
    return await fetchEspnLiveGames();
  } catch (error) {
    console.error("ESPN scoreboard unavailable, skipping live game alerts this run", { error });

    return null;
  }
};

const getAlertGameOrNull = async (dbGame: DbAlertGame, espnGame: EspnGame): Promise<AlertGame | null> => {
  try {
    return toAlertGame(dbGame, espnGame, await fetchEspnSummary(espnGame.eventId));
  } catch (error) {
    console.error("ESPN summary unavailable, skipping game", { error, eventId: espnGame.eventId });

    return null;
  }
};

const getWeekContext = async (week: number, games: AlertGame[], now: Date): Promise<AlertContext | null> => {
  const subscriberIds = await getLiveAlertSubscriberIds();

  if (subscriberIds.length === 0) {
    return null;
  }

  const [weekGames, picks, survivorPicks] = await Promise.all([
    getWeekProjectionGames(week),
    getWeekProjectionPicks(week),
    getAliveSurvivorPicks(week),
  ]);

  return {
    games,
    now,
    picks,
    projectionGames: buildProjectionGames(weekGames, games),
    subscribers: new Set(subscriberIds),
    survivorPicks: survivorPicks.flatMap(({ TeamID, UserID }) =>
      TeamID === null ? [] : [{ teamId: TeamID, userId: UserID }],
    ),
    week,
  };
};

const alertWeek = async (week: number, allGames: AlertGame[], now: Date): Promise<void> => {
  const games = allGames.filter((game) => game.week === week);
  const context = await getWeekContext(week, games, now);

  if (!context) {
    console.log("No subscribers for live game alerts", { week });

    return;
  }

  const alerts = buildLiveAlerts(context);
  const result = await sendLiveAlerts(alerts);

  console.log("Live game alerts processed", { alerts: alerts.length, games: games.length, week, ...result });
};

/**
 * Runs every minute during the season. Stays quiet and cheap unless one of our games is in progress, then reads
 * ESPN (never writing its data anywhere) and sends push alerts. Alerts are deduplicated through the Emails log,
 * so overlapping or repeated runs never notify anyone twice. Transient ESPN failures are logged, not thrown.
 */
export const handler: Handler<never, void> = async (_event, _context) => {
  const now = new Date();
  const dbGames = await getLiveAlertGames(now);

  if (dbGames.length === 0) {
    return;
  }

  const espnGames = await getEspnGamesOrNull();
  const matches = matchEspnGames(dbGames, espnGames ?? []);

  if (matches.length === 0) {
    console.log("No live ESPN games match our games, exiting", { candidates: dbGames.length });

    return;
  }

  const games = (await Promise.all(matches.map(({ dbGame, espnGame }) => getAlertGameOrNull(dbGame, espnGame)))).filter(
    (game): game is AlertGame => game !== null,
  );

  for (const week of new Set(games.map((game) => game.week))) {
    // react-doctor-disable-next-line async-await-in-loop -- at most one or two weeks are ever live, and each sends pushes in order
    await alertWeek(week, games, now);
  }
};
