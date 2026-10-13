import type { AlertGame, AlertTeam } from "./types";

const ORDINAL_SUFFIXES: Record<number, string> = { 1: "st", 2: "nd", 3: "rd" };
const TEEN_START = 11;
const TEEN_END = 13;

export const toOrdinal = (value: number): string => {
  const isTeen = value % 100 >= TEEN_START && value % 100 <= TEEN_END;

  return `${value}${isTeen ? "th" : (ORDINAL_SUFFIXES[value % 10] ?? "th")}`;
};

/** "in the 4th" or "in overtime". */
export const toPeriodPhrase = (period: number): string => (period >= 5 ? "in overtime" : "in the 4th");

/** Higher score first, with an en dash, e.g. "20–19". */
export const toScoreText = (first: number, second: number): string =>
  `${Math.max(first, second)}–${Math.min(first, second)}`;

export const toPointsText = (points: number): string => `${points} point${points === 1 ? "" : "s"}`;

export const getGamePath = (game: Pick<AlertGame, "eventId">): string => `/scoreboard/game/${game.eventId}`;

export const getWeekPath = (week: number): string => `/scoreboard?week=${week}`;

export const getOpponent = (game: AlertGame, team: AlertTeam): AlertTeam =>
  team.id === game.home.id ? game.visitor : game.home;
