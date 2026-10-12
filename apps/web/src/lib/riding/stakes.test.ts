import { describe, expect, it } from "vitest";

import { buildGameStakes, type RidingGame } from "./stakes";

type Pick = Parameters<typeof buildGameStakes>[1][number];

const NOW = new Date("2026-10-11T18:00:00Z");

const game = (overrides: Partial<RidingGame> & { GameID: number }): RidingGame => ({
  GameHomeScore: 0,
  GameKickoff: new Date("2026-10-11T17:00:00Z"),
  GameStatus: "2nd Quarter",
  GameVisitorScore: 0,
  HomeTeamID: overrides.GameID * 10,
  VisitorTeamID: overrides.GameID * 10 + 1,
  WinnerTeamID: null,
  ...overrides,
});

const pick = (UserID: number, GameID: number, TeamID: null | number, PickPoints: null | number): Pick => ({
  GameID,
  PickPoints,
  TeamID,
  UserID,
});

const statusFor = (target: RidingGame, teamId: number) =>
  buildGameStakes([target], [pick(1, target.GameID, teamId, 5)], 1, NOW)[target.GameID]?.pick?.status;

describe("pick status", () => {
  it("is winning, losing or tied from the live score", () => {
    const live = game({ GameHomeScore: 14, GameID: 1, GameVisitorScore: 7 });

    expect(statusFor(live, 10)).toBe("winning");
    expect(statusFor(live, 11)).toBe("losing");
    expect(statusFor({ ...live, GameVisitorScore: 14 }, 10)).toBe("tied");
  });

  it("prefers the official winner over the score", () => {
    const final = game({ GameHomeScore: 3, GameID: 1, GameStatus: "Final", GameVisitorScore: 10, WinnerTeamID: 11 });
    const overlaid = { ...final, isLiveOverlay: true };

    expect(buildGameStakes([overlaid], [pick(1, 1, 11, 5)], 1, NOW)[1]?.pick?.status).toBe("winning");
    expect(buildGameStakes([overlaid], [pick(1, 1, 10, 5)], 1, NOW)[1]?.pick?.status).toBe("losing");
  });

  it("is tied once kicked off but before any score", () => {
    expect(statusFor(game({ GameID: 1, GameStatus: "Pregame" }), 10)).toBe("tied");
  });
});

describe("pool split", () => {
  it("counts picks and confidence points per side for one game only", () => {
    const g = game({ GameID: 1 });
    const picks = [pick(1, 1, 10, 16), pick(2, 1, 10, 4), pick(3, 1, 11, 9), pick(4, 2, 20, 12), pick(5, 1, null, 3)];

    expect(buildGameStakes([g], picks, 9, NOW)[1]?.split).toEqual({
      home: { count: 2, points: 20 },
      visitor: { count: 1, points: 9 },
    });
  });
});

describe("projected totals and rank", () => {
  const games = [
    game({ GameID: 1, GameStatus: "Final", WinnerTeamID: 10 }),
    game({ GameHomeScore: 7, GameID: 2, GameVisitorScore: 3 }),
    game({ GameID: 3, GameKickoff: new Date("2026-10-11T20:00:00Z"), GameStatus: "Pregame" }),
  ];
  const picks = [
    pick(1, 1, 10, 5),
    pick(1, 2, 20, 3),
    pick(1, 3, 30, 9),
    pick(2, 1, 11, 5),
    pick(2, 2, 20, 3),
    pick(3, 1, 10, 2),
    pick(3, 2, 21, 4),
    pick(4, 1, 10, 5),
    pick(4, 2, 20, 3),
  ];

  it("adds final wins and current leaders, ignoring unstarted games, and shares tied ranks", () => {
    const ranks = [1, 2, 3, 4].map((userId) => buildGameStakes(games, picks, userId, NOW)[2]);

    expect(ranks.map((stakes) => stakes?.currentTotal)).toEqual([8, 3, 2, 8]);
    expect(ranks.map((stakes) => stakes?.currentRank)).toEqual([1, 3, 4, 1]);
  });
});

describe("buildGameStakes", () => {
  const games = [
    game({ GameHomeScore: 7, GameID: 1, GameVisitorScore: 3 }),
    game({ GameID: 2, GameKickoff: new Date("2026-10-11T20:00:00Z"), GameStatus: "Pregame" }),
    game({ GameID: 3, GameStatus: "Final", WinnerTeamID: 30 }),
  ];
  const picks = [pick(1, 1, 11, 10), pick(2, 1, 10, 6), pick(1, 3, 30, 2), pick(2, 3, 31, 1)];

  it("only builds stakes for started, not-final games", () => {
    expect(Object.keys(buildGameStakes(games, picks, 1, NOW))).toEqual(["1"]);
  });

  it("reports the pick status, totals and the flip scenario for the user", () => {
    const stakes = buildGameStakes(games, picks, 1, NOW)[1];

    expect(stakes?.pick).toEqual({
      ifLoses: { rank: 2, total: 2 },
      ifWins: { rank: 1, total: 12 },
      points: 10,
      status: "losing",
      teamId: 11,
    });
    expect(stakes?.currentTotal).toBe(2);
    expect(stakes?.currentRank).toBe(2);
    expect(stakes?.split).toEqual({ home: { count: 1, points: 6 }, visitor: { count: 1, points: 10 } });
  });

  it("returns no pick detail when the user has no pick for the game", () => {
    expect(buildGameStakes(games, picks, 3, NOW)[1]?.pick).toBeNull();
  });

  it("includes a game the live overlay already marked final", () => {
    const overlaid = [{ ...(games[2] as RidingGame), isLiveOverlay: true }];

    expect(Object.keys(buildGameStakes(overlaid, picks, 1, NOW))).toEqual(["3"]);
  });
});
