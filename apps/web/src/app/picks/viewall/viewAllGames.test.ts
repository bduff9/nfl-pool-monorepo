import { describe, expect, it } from "vitest";

import { resolveViewAllGames, updateGames } from "./viewAllGames";

const a = { GameID: 1, tag: "first" };
const dup = { GameID: 1, tag: "second" };
const b = { GameID: 2, tag: "b" };

describe("updateGames", () => {
  it("keys games by id and keeps the first duplicate", () => {
    expect(updateGames([a, dup, b])).toEqual({ 1: a, 2: b });
  });
});

describe("resolveViewAllGames", () => {
  it("uses live games in live mode even with custom games", () => {
    expect(resolveViewAllGames({ customGames: { 2: b }, gamesForWeek: [a], isLive: true })).toEqual({
      games: { 1: a },
      isShowingCustomGames: false,
    });
  });

  it("uses custom games in what-if mode", () => {
    expect(resolveViewAllGames({ customGames: { 2: b }, gamesForWeek: [a], isLive: false })).toEqual({
      games: { 2: b },
      isShowingCustomGames: true,
    });
  });

  it("falls back to live games in what-if mode before any custom games exist", () => {
    expect(resolveViewAllGames({ customGames: null, gamesForWeek: [a], isLive: false })).toEqual({
      games: { 1: a },
      isShowingCustomGames: false,
    });
  });
});
