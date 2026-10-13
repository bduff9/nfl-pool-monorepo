import type { AlertContext, AlertGame, AlertPlay } from "./types";

export const NOW = new Date("2026-10-13T02:50:00Z");

export const BILLS = { id: 4, name: "Bills", shortName: "BUF" };
export const RAMS = { id: 28, name: "Rams", shortName: "LAR" };

export const minutesAgo = (minutes: number): Date => new Date(NOW.getTime() - minutes * 60_000);

/** A scoring play with the score after it; `ago` is how many minutes before NOW it happened (null: no timestamp). */
export const makePlay = (
  id: string,
  homeScore: number,
  awayScore: number,
  period: number,
  ago: null | number,
): AlertPlay => ({
  awayScore,
  homeScore,
  id,
  period,
  wallclock: ago === null ? null : minutesAgo(ago),
});

/** BUF (visitor) at LAR (home), live by default. */
export const makeGame = (overrides: Partial<AlertGame> = {}): AlertGame => ({
  endedAt: null,
  eventId: "401872994",
  gameId: 1,
  home: RAMS,
  homeScore: 0,
  plays: [],
  state: "in",
  visitor: BILLS,
  visitorScore: 0,
  week: 5,
  ...overrides,
});

export const makeContext = (overrides: Partial<AlertContext> = {}): AlertContext => ({
  games: [],
  now: NOW,
  picks: [],
  projectionGames: [],
  subscribers: new Set<number>(),
  survivorPicks: [],
  week: 5,
  ...overrides,
});
