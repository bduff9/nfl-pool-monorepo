import { describe, expect, it, vi } from "vitest";

import type { ScoreboardGame } from "./ScoreboardGameCard";
import {
  findHandedOffGame,
  forgetScoreboard,
  getHandedOffWeek,
  getScoreboardGamesSnapshot,
  getScoreboardScroll,
  getScoreboardStakesSnapshot,
  getServerScoreboardGamesSnapshot,
  rememberScoreboardGames,
  rememberScoreboardScroll,
  subscribeScoreboardGames,
} from "./scoreboardHandoff";

const game = (GameWeek: number, espnEventId?: string): ScoreboardGame =>
  ({ espnEventId, GameWeek }) as unknown as ScoreboardGame;

describe("scoreboardHandoff store", () => {
  it("remembers the latest games and notifies subscribers once per new list", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeScoreboardGames(listener);
    const games = [game(1, "401")];

    rememberScoreboardGames(games);
    rememberScoreboardGames(games);

    expect(getScoreboardGamesSnapshot()).toBe(games);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    rememberScoreboardGames([game(2)]);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("remembers the stakes with the games, and notifies when only the stakes change", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeScoreboardGames(listener);
    const games = [game(1, "401")];
    const stakes = { 1: {} } as never;

    rememberScoreboardGames(games);
    rememberScoreboardGames(games, stakes);

    expect(getScoreboardStakesSnapshot()).toBe(stakes);
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
  });

  it("forgets the games, stakes and scroll position on sign out, and tells the subscribers", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeScoreboardGames(listener);

    rememberScoreboardGames([game(1, "401")], { 1: {} } as never);
    rememberScoreboardScroll(500);
    forgetScoreboard();

    expect(getScoreboardGamesSnapshot()).toBeUndefined();
    expect(getScoreboardStakesSnapshot()).toBeUndefined();
    expect(getScoreboardScroll()).toBe(0);
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
  });

  it("remembers the scroll position", () => {
    rememberScoreboardScroll(1234);

    expect(getScoreboardScroll()).toBe(1234);
  });

  it("never has games on the server", () => {
    expect(getServerScoreboardGamesSnapshot()).toBeUndefined();
  });
});

describe("findHandedOffGame", () => {
  it("finds the game by ESPN event id", () => {
    const wanted = game(1, "402");

    expect(findHandedOffGame([game(1, "401"), wanted], "402")).toBe(wanted);
    expect(findHandedOffGame([game(1, "401")], "999")).toBeUndefined();
    expect(findHandedOffGame(undefined, "401")).toBeUndefined();
  });
});

describe("getHandedOffWeek", () => {
  it("returns the remembered list only for its own week", () => {
    const games = [game(3, "401"), game(3)];

    expect(getHandedOffWeek(games, 3)).toBe(games);
    expect(getHandedOffWeek(games, 4)).toBeUndefined();
    expect(getHandedOffWeek(games, null)).toBeUndefined();
    expect(getHandedOffWeek([], 3)).toBeUndefined();
    expect(getHandedOffWeek(undefined, 3)).toBeUndefined();
  });
});
