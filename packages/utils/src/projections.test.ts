import { describe, expect, it } from "vitest";

import {
  forceWinner,
  getLeader,
  getProjectedRank,
  getProjectedTotals,
  getWinningTeam,
  type ProjectionGame,
  type ProjectionPick,
} from "./projections";

const game = (overrides: Partial<ProjectionGame> & { GameID: number }): ProjectionGame => ({
  GameHomeScore: 0,
  GameStatus: "2nd Quarter",
  GameVisitorScore: 0,
  HomeTeamID: overrides.GameID * 10,
  VisitorTeamID: overrides.GameID * 10 + 1,
  WinnerTeamID: null,
  ...overrides,
});

const pick = (UserID: number, GameID: number, TeamID: null | number, PickPoints: null | number): ProjectionPick => ({
  GameID,
  PickPoints,
  TeamID,
  UserID,
});

describe("getLeader", () => {
  it("is the team ahead, or null when tied or before kickoff", () => {
    expect(getLeader(game({ GameHomeScore: 7, GameID: 1 }))).toBe(10);
    expect(getLeader(game({ GameID: 1, GameVisitorScore: 7 }))).toBe(11);
    expect(getLeader(game({ GameHomeScore: 7, GameID: 1, GameVisitorScore: 7 }))).toBeNull();
    expect(getLeader(game({ GameHomeScore: 7, GameID: 1, GameStatus: "Pregame" }))).toBeNull();
  });
});

describe("getWinningTeam", () => {
  it("prefers the official winner over the score", () => {
    expect(getWinningTeam(game({ GameHomeScore: 3, GameID: 1, GameVisitorScore: 10, WinnerTeamID: 10 }))).toBe(10);
    expect(getWinningTeam(game({ GameHomeScore: 3, GameID: 1, GameVisitorScore: 10 }))).toBe(11);
  });
});

describe("projected totals and rank", () => {
  const games = [
    game({ GameID: 1, GameStatus: "Final", WinnerTeamID: 10 }),
    game({ GameHomeScore: 7, GameID: 2, GameVisitorScore: 3 }),
    game({ GameID: 3, GameStatus: "Pregame" }),
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
    pick(5, 2, null, 7),
  ];

  it("adds final wins and current leaders, ignoring unstarted games and unmade picks", () => {
    const totals = getProjectedTotals(games, picks);

    expect([1, 2, 3, 4, 5].map((userId) => totals.get(userId))).toEqual([8, 3, 2, 8, 0]);
  });

  it("shares tied ranks using competition ranking", () => {
    const totals = getProjectedTotals(games, picks);

    expect([1, 2, 3, 4, 5].map((userId) => getProjectedRank(totals, userId))).toEqual([1, 3, 4, 1, 5]);
  });

  it("forces one game to a final winner without touching the others", () => {
    const forced = forceWinner(games, 2, 21);

    expect(forced[1]).toMatchObject({ GameStatus: "Final", WinnerTeamID: 21 });
    expect(forced[0]).toBe(games[0]);
    expect(getProjectedTotals(forced, picks).get(3)).toBe(6);
  });
});
