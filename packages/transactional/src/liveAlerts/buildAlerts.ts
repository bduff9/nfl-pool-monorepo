import type { ProjectionGame } from "@nfl-pool-monorepo/utils/projections";

import { getLeadChangeAlerts, getPointsEarnedAlerts } from "./confidenceAlerts";
import { getRankChangeAlerts } from "./rankAlerts";
import { getSurvivorBehindAlerts, getSurvivorResultAlerts } from "./survivorAlerts";
import type { AlertContext, AlertGame, LiveAlert } from "./types";

/** A finished ESPN game's winner for projections; null for a tie, which earns nobody points. */
const getEspnWinnerId = (game: AlertGame): null | number => {
  if (game.homeScore === game.visitorScore) {
    return null;
  }

  return game.homeScore > game.visitorScore ? game.home.id : game.visitor.id;
};

const toEspnProjection = (dbGame: ProjectionGame, game: AlertGame): ProjectionGame => ({
  ...dbGame,
  GameHomeScore: game.homeScore,
  GameStatus: game.state === "post" ? "Final" : "In Progress",
  GameVisitorScore: game.visitorScore,
  WinnerTeamID: game.state === "post" ? getEspnWinnerId(game) : null,
});

/**
 * Every game of the week as it currently stands: official finals from the database, and ESPN's current scores for
 * games ESPN says are in progress or over but the database has not finalized yet. ESPN data is only used here, in
 * memory, and is never written back.
 */
export const buildProjectionGames = (dbGames: ProjectionGame[], espnGames: AlertGame[]): ProjectionGame[] =>
  dbGames.map((dbGame) => {
    const espnGame = espnGames.find((game) => game.gameId === dbGame.GameID);

    return espnGame && dbGame.GameStatus !== "Final" ? toEspnProjection(dbGame, espnGame) : dbGame;
  });

/** Every alert the current state of the week's live games calls for, across all the alert rules. */
export const buildLiveAlerts = (context: AlertContext): LiveAlert[] => [
  ...getSurvivorBehindAlerts(context),
  ...getSurvivorResultAlerts(context),
  ...getLeadChangeAlerts(context),
  ...getRankChangeAlerts(context),
  ...getPointsEarnedAlerts(context),
];
