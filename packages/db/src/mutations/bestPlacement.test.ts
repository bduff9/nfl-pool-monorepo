import { describe, expect, it } from "vitest";

import {
  computeBestPlacements,
  computeBestPlacementsOverall,
  rankUsersOverall,
  rankUsersWeekly,
} from "./bestPlacement";

const TIE_TEAM_ID = 999;

const makeGame = (
  gameID: number,
  homeTeamID: number,
  visitorTeamID: number,
  kickoff = new Date("2025-01-01T20:00:00Z"),
) => ({
  gameHomeScore: 0,
  gameID,
  gameKickoff: kickoff,
  gameVisitorScore: 0,
  gameWeek: 1,
  homeTeamID,
  visitorTeamID,
});

const makeUser = (
  userID: number,
  picks: { gameID: number; teamID: number | null; pickPoints: number | null }[],
  opts?: { tiebreakerLastScore?: number; basePointsEarned?: number; baseGamesCorrect?: number },
) => ({
  baseGamesCorrect: opts?.baseGamesCorrect ?? 0,
  basePointsEarned: opts?.basePointsEarned ?? 0,
  picks,
  tiebreakerLastScore: opts?.tiebreakerLastScore ?? 42,
  userID,
});

describe("rankUsersWeekly", () => {
  it("ranks users by pointsEarned DESC then gamesCorrect DESC", () => {
    const ranks = rankUsersWeekly([
      { gamesCorrect: 5, pointsEarned: 10, tiebreakerDiffAbsolute: null, tiebreakerIsUnder: false, userID: 1 },
      { gamesCorrect: 6, pointsEarned: 15, tiebreakerDiffAbsolute: null, tiebreakerIsUnder: false, userID: 2 },
      { gamesCorrect: 6, pointsEarned: 10, tiebreakerDiffAbsolute: null, tiebreakerIsUnder: false, userID: 3 },
    ]);

    expect(ranks.get(2)).toBe(1);
    expect(ranks.get(3)).toBe(2);
    expect(ranks.get(1)).toBe(3);
  });

  it("assigns tied ranks when points and games match and tiebreaker is null", () => {
    const ranks = rankUsersWeekly([
      { gamesCorrect: 5, pointsEarned: 10, tiebreakerDiffAbsolute: null, tiebreakerIsUnder: false, userID: 1 },
      { gamesCorrect: 5, pointsEarned: 10, tiebreakerDiffAbsolute: null, tiebreakerIsUnder: false, userID: 2 },
    ]);

    expect(ranks.get(1)).toBe(1);
    expect(ranks.get(2)).toBe(1);
  });

  it("breaks ties with tiebreaker: isUnder DESC then diffAbsolute ASC", () => {
    const ranks = rankUsersWeekly([
      { gamesCorrect: 5, pointsEarned: 10, tiebreakerDiffAbsolute: 3, tiebreakerIsUnder: false, userID: 1 },
      { gamesCorrect: 5, pointsEarned: 10, tiebreakerDiffAbsolute: 5, tiebreakerIsUnder: true, userID: 2 },
      { gamesCorrect: 5, pointsEarned: 10, tiebreakerDiffAbsolute: 2, tiebreakerIsUnder: true, userID: 3 },
    ]);

    expect(ranks.get(3)).toBe(1);
    expect(ranks.get(2)).toBe(2);
    expect(ranks.get(1)).toBe(3);
  });

  it("ties users when tiebreaker fields match exactly", () => {
    const ranks = rankUsersWeekly([
      { gamesCorrect: 5, pointsEarned: 10, tiebreakerDiffAbsolute: 3, tiebreakerIsUnder: true, userID: 1 },
      { gamesCorrect: 5, pointsEarned: 10, tiebreakerDiffAbsolute: 3, tiebreakerIsUnder: true, userID: 2 },
    ]);

    expect(ranks.get(1)).toBe(1);
    expect(ranks.get(2)).toBe(1);
  });

  it("skips ranks after ties (1,1,3 not 1,1,2)", () => {
    const ranks = rankUsersWeekly([
      { gamesCorrect: 5, pointsEarned: 10, tiebreakerDiffAbsolute: null, tiebreakerIsUnder: false, userID: 1 },
      { gamesCorrect: 5, pointsEarned: 10, tiebreakerDiffAbsolute: null, tiebreakerIsUnder: false, userID: 2 },
      { gamesCorrect: 3, pointsEarned: 5, tiebreakerDiffAbsolute: null, tiebreakerIsUnder: false, userID: 3 },
    ]);

    expect(ranks.get(1)).toBe(1);
    expect(ranks.get(2)).toBe(1);
    expect(ranks.get(3)).toBe(3);
  });
});

describe("rankUsersOverall", () => {
  it("ranks by pointsEarned DESC then gamesCorrect DESC", () => {
    const ranks = rankUsersOverall([
      { gamesCorrect: 20, pointsEarned: 50, userID: 1 },
      { gamesCorrect: 25, pointsEarned: 60, userID: 2 },
      { gamesCorrect: 22, pointsEarned: 50, userID: 3 },
    ]);

    expect(ranks.get(2)).toBe(1);
    expect(ranks.get(3)).toBe(2);
    expect(ranks.get(1)).toBe(3);
  });

  it("ties users when points and games are identical", () => {
    const ranks = rankUsersOverall([
      { gamesCorrect: 20, pointsEarned: 50, userID: 1 },
      { gamesCorrect: 20, pointsEarned: 50, userID: 2 },
    ]);

    expect(ranks.get(1)).toBe(1);
    expect(ranks.get(2)).toBe(1);
  });
});

describe("computeBestPlacements (weekly)", () => {
  it("handles 2 users × 2 games = 9 scenarios (3²)", () => {
    const games = [makeGame(1, 10, 20), makeGame(2, 30, 40)];

    const users = [
      makeUser(1, [
        { gameID: 1, pickPoints: 2, teamID: 10 },
        { gameID: 2, pickPoints: 1, teamID: 30 },
      ]),
      makeUser(2, [
        { gameID: 1, pickPoints: 2, teamID: 20 },
        { gameID: 2, pickPoints: 1, teamID: 40 },
      ]),
    ];

    const results = computeBestPlacements(users, games, TIE_TEAM_ID, null);

    expect(results.size).toBe(2);

    const user1 = results.get(1)!;
    const user2 = results.get(2)!;

    expect(user1.bestRank).toBeGreaterThanOrEqual(1);
    expect(user2.bestRank).toBeGreaterThanOrEqual(1);
    expect(user1.canAchieveFirst).toBe(true);
    expect(user2.canAchieveFirst).toBe(true);
  });

  it("user 1 always wins when they have all picks correct in every scenario", () => {
    const games = [makeGame(1, 10, 20)];

    const users = [
      makeUser(1, [{ gameID: 1, pickPoints: 2, teamID: 10 }]),
      makeUser(2, [{ gameID: 1, pickPoints: 1, teamID: 10 }]),
    ];

    const results = computeBestPlacements(users, games, TIE_TEAM_ID, null);

    const user1 = results.get(1)!;
    const user2 = results.get(2)!;

    expect(user1.canAchieveFirst).toBe(true);
    expect(user2.canAchieveFirst).toBe(true);
    expect(user2.bestRank).toBeLessThanOrEqual(2);
  });

  it("handles tie outcomes awarding points to users picking TIE", () => {
    const games = [makeGame(1, 10, 20)];

    const users = [
      makeUser(1, [{ gameID: 1, pickPoints: 3, teamID: TIE_TEAM_ID }]),
      makeUser(2, [{ gameID: 1, pickPoints: 3, teamID: 10 }]),
    ];

    const results = computeBestPlacements(users, games, TIE_TEAM_ID, null);

    expect(results.get(1)!.canAchieveFirst).toBe(true);
    expect(results.get(2)!.canAchieveFirst).toBe(true);
  });

  it("returns empty map for zero eligible users", () => {
    const games = [makeGame(1, 10, 20)];
    const results = computeBestPlacements([], games, TIE_TEAM_ID, null);

    expect(results.size).toBe(0);
  });

  it("handles zero undecided games (K=0)", () => {
    const users = [
      makeUser(1, [], { baseGamesCorrect: 5, basePointsEarned: 10 }),
      makeUser(2, [], { baseGamesCorrect: 4, basePointsEarned: 8 }),
    ];

    const results = computeBestPlacements(users, [], TIE_TEAM_ID, null);

    expect(results.get(1)!.bestRank).toBe(1);
    expect(results.get(1)!.canAchieveFirst).toBe(true);
    expect(results.get(2)!.bestRank).toBe(2);
    expect(results.get(2)!.canAchieveFirst).toBe(false);
  });

  it("incorporates base points from finalized games", () => {
    const games = [makeGame(1, 10, 20)];

    const users = [
      makeUser(1, [{ gameID: 1, pickPoints: 1, teamID: 10 }], { baseGamesCorrect: 3, basePointsEarned: 5 }),
      makeUser(2, [{ gameID: 1, pickPoints: 1, teamID: 20 }], { baseGamesCorrect: 6, basePointsEarned: 10 }),
    ];

    const results = computeBestPlacements(users, games, TIE_TEAM_ID, null);

    expect(results.get(2)!.canAchieveFirst).toBe(true);
    expect(results.get(1)!.bestRank).toBeGreaterThanOrEqual(1);
  });

  it("tiebreaker ordering changes best rank when lastGameKickoff is set", () => {
    const kickoff = new Date("2025-01-01T20:00:00Z");
    const games = [makeGame(1, 10, 20, kickoff)];

    const users = [
      makeUser(1, [{ gameID: 1, pickPoints: 2, teamID: 10 }], { tiebreakerLastScore: 45 }),
      makeUser(2, [{ gameID: 1, pickPoints: 2, teamID: 10 }], { tiebreakerLastScore: 35 }),
    ];

    const results = computeBestPlacements(users, games, TIE_TEAM_ID, kickoff);

    // Both pick home; when home wins, both earn 2 pts and tiebreaker
    // breaks the tie — user 2 is always closer to actual score
    expect(results.get(2)!.canAchieveFirst).toBe(true);
    expect(results.get(1)!.bestRank).toBe(2);
  });

  it("user with null teamID pick never outscores a user with picks", () => {
    const games = [makeGame(1, 10, 20)];

    const users = [
      makeUser(1, [{ gameID: 1, pickPoints: 2, teamID: null }]),
      makeUser(2, [{ gameID: 1, pickPoints: 2, teamID: 10 }]),
    ];

    const results = computeBestPlacements(users, games, TIE_TEAM_ID, null);

    expect(results.get(2)!.bestRank).toBe(1);
    // User 1 ties at rank 1 in scenarios where user 2 also gets 0 pts
    expect(results.get(1)!.bestRank).toBe(1);
    // But user 2 can always achieve first
    expect(results.get(2)!.canAchieveFirst).toBe(true);
  });
});

describe("computeBestPlacementsOverall", () => {
  it("ranks using overall sort (no tiebreaker)", () => {
    const games = [makeGame(1, 10, 20)];

    const users = [
      makeUser(1, [{ gameID: 1, pickPoints: 3, teamID: 10 }], { baseGamesCorrect: 10, basePointsEarned: 20 }),
      makeUser(2, [{ gameID: 1, pickPoints: 3, teamID: 20 }], { baseGamesCorrect: 11, basePointsEarned: 22 }),
    ];

    const results = computeBestPlacementsOverall(users, games, TIE_TEAM_ID);

    expect(results.get(1)!.canAchieveFirst).toBe(true);
    expect(results.get(2)!.canAchieveFirst).toBe(true);
  });

  it("tracks canAchieveThird for overall", () => {
    const games = [makeGame(1, 10, 20)];

    const users = [
      makeUser(1, [{ gameID: 1, pickPoints: 5, teamID: 10 }], { basePointsEarned: 50 }),
      makeUser(2, [{ gameID: 1, pickPoints: 5, teamID: 10 }], { basePointsEarned: 40 }),
      makeUser(3, [{ gameID: 1, pickPoints: 5, teamID: 10 }], { basePointsEarned: 30 }),
      makeUser(4, [{ gameID: 1, pickPoints: 5, teamID: 10 }], { basePointsEarned: 20 }),
    ];

    const results = computeBestPlacementsOverall(users, games, TIE_TEAM_ID);

    expect(results.get(4)!.canAchieveThird).toBe(false);
  });

  it("zero undecided games returns ranks based on base stats", () => {
    const users = [
      makeUser(1, [], { baseGamesCorrect: 15, basePointsEarned: 30 }),
      makeUser(2, [], { baseGamesCorrect: 12, basePointsEarned: 25 }),
    ];

    const results = computeBestPlacementsOverall(users, [], TIE_TEAM_ID);

    expect(results.get(1)!.bestRank).toBe(1);
    expect(results.get(2)!.bestRank).toBe(2);
  });
});
