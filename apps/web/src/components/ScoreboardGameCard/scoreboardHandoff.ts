import type { GameStakes } from "@/lib/riding/stakes";

import type { ScoreboardGame } from "./ScoreboardGameCard";

/*
 * Hands the scoreboard's games from one page to the next on the client. The scoreboard and a game page each load
 * their data after a navigation commits, so without this both would first show skeletons, and the game card would
 * morph into an empty placeholder. With it, the game page's loading state shows the tapped game's card, and the
 * scoreboard's loading state on the way back shows the whole list, filled, so the card moves between the pages with
 * its content. Read it through useSyncExternalStore with a server snapshot of undefined, so server rendering and
 * hydration always show the plain skeleton.
 */
type Stakes = Record<number, GameStakes>;

let games: readonly ScoreboardGame[] | undefined;
// The signed-in user's "what's riding" rows under the games, so the list on the way back is as tall as the real one
let stakes: Stakes | undefined;
let scrollY = 0;
const listeners = new Set<() => void>();

const notify = (): void => {
  for (const listener of listeners) {
    listener();
  }
};

/** Remembers the games (and their stakes) the scoreboard last rendered. */
export const rememberScoreboardGames = (next: readonly ScoreboardGame[], nextStakes?: Stakes): void => {
  if (next === games && nextStakes === stakes) {
    return;
  }

  games = next;
  stakes = nextStakes;
  notify();
};

/** Drops everything remembered (signing out), so the next user signed in on this tab never sees this one's stakes. */
export const forgetScoreboard = (): void => {
  games = undefined;
  stakes = undefined;
  scrollY = 0;
  notify();
};

export const subscribeScoreboardGames = (listener: () => void): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const getScoreboardGamesSnapshot = (): readonly ScoreboardGame[] | undefined => games;

export const getScoreboardStakesSnapshot = (): Stakes | undefined => stakes;

/** Remembers how far the scoreboard was scrolled when the user left it, so coming back can return there. */
export const rememberScoreboardScroll = (y: number): void => {
  scrollY = y;
};

export const getScoreboardScroll = (): number => scrollY;

export const getServerScoreboardGamesSnapshot = (): undefined => undefined;

/** The remembered card for a game page, by its ESPN event id. */
export const findHandedOffGame = (
  remembered: readonly ScoreboardGame[] | undefined,
  eventId: string,
): ScoreboardGame | undefined => remembered?.find((game) => game.espnEventId === eventId);

/** The remembered list, only when it is the week being loaded. */
export const getHandedOffWeek = (
  remembered: readonly ScoreboardGame[] | undefined,
  week: number | null,
): readonly ScoreboardGame[] | undefined =>
  remembered?.length && remembered.every((game) => game.GameWeek === week) ? remembered : undefined;
