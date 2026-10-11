import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sortPicks } from "./arrays";

type Ranks = Parameters<typeof sortPicks>[2];
type Picks = Parameters<typeof sortPicks>[0];
type Games = Parameters<typeof sortPicks>[1];

const rank = (UserID: number, extra: { LastScore?: number | null; TiebreakerScore?: number | null } = {}) =>
  ({ LastScore: null, TiebreakerScore: null, UserID, ...extra }) as unknown as Ranks[number];

const pick = (UserID: number, GameID: number, TeamID: number | null, PickPoints: number | null) =>
  ({ GameID, PickPoints, TeamID, UserID }) as unknown as Picks[number];

const games = {
  1: { WinnerTeamID: 10 },
  2: { WinnerTeamID: 20 },
  3: { WinnerTeamID: null },
} as unknown as Games;

const summarize = (result: Ranks) =>
  result.map((r) => [r.UserID, r.PointsEarned, r.GamesCorrect, r.Rank, r.Tied] as const);

describe("sortPicks", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns an empty list without picks or ranks", () => {
    expect(sortPicks(undefined as unknown as Picks, games, [rank(1)])).toEqual([]);
    expect(sortPicks([], games, undefined as unknown as Ranks)).toEqual([]);
  });

  it("scores only winning picks on known games with a team and a winner", () => {
    const result = sortPicks(
      [
        pick(1, 1, 10, 5),
        pick(1, 2, 21, 4),
        pick(1, 3, 30, 3),
        pick(1, 99, 10, 2),
        pick(1, 2, null, 1),
        pick(2, 2, 20, null),
        pick(2, 1, 10, 7),
      ],
      games,
      [rank(1), rank(2)],
    );

    expect(summarize(result)).toEqual([
      [2, 7, 2, 1, 0],
      [1, 5, 1, 2, 0],
    ]);
  });

  it("orders by points, then games correct", () => {
    const result = sortPicks([pick(1, 1, 10, 3), pick(2, 1, 10, 1), pick(2, 2, 20, 2), pick(3, 1, 10, 5)], games, [
      rank(1),
      rank(2),
      rank(3),
    ]);

    expect(summarize(result)).toEqual([
      [3, 5, 1, 1, 0],
      [2, 3, 2, 2, 0],
      [1, 3, 1, 3, 0],
    ]);
  });

  it("keeps ties without a last score and ranks them equally", () => {
    const result = sortPicks([pick(1, 1, 10, 4), pick(2, 1, 10, 4), pick(3, 2, 20, 1)], games, [
      rank(1),
      rank(2),
      rank(3),
    ]);

    expect(summarize(result)).toEqual([
      [1, 4, 1, 1, 1],
      [2, 4, 1, 1, 1],
      [3, 1, 1, 3, 0],
    ]);
  });

  it("breaks full ties by not going over, then by closeness to the last score", () => {
    const picks = [1, 2, 3, 4].map((id) => pick(id, 1, 10, 5));
    const result = sortPicks(picks, games, [
      rank(1, { LastScore: 40, TiebreakerScore: 45 }),
      rank(2, { LastScore: 40, TiebreakerScore: 38 }),
      rank(3, { LastScore: 40, TiebreakerScore: 30 }),
      rank(4, { LastScore: 40, TiebreakerScore: 40 }),
    ]);

    expect(summarize(result)).toEqual([
      [4, 5, 1, 1, 0],
      [2, 5, 1, 2, 0],
      [3, 5, 1, 3, 0],
      [1, 5, 1, 4, 0],
    ]);
  });

  it("treats a missing tiebreaker score as zero and identical diffs as tied", () => {
    const picks = [1, 2, 3].map((id) => pick(id, 1, 10, 5));
    const result = sortPicks(picks, games, [
      rank(1, { LastScore: 10, TiebreakerScore: null }),
      rank(2, { LastScore: 10, TiebreakerScore: 0 }),
      rank(3, { LastScore: 10, TiebreakerScore: 20 }),
    ]);

    expect(summarize(result)).toEqual([
      [1, 5, 1, 1, 1],
      [2, 5, 1, 1, 1],
      [3, 5, 1, 3, 0],
    ]);
  });

  it("ranks a tie in the middle of the list", () => {
    const result = sortPicks(
      [pick(1, 1, 10, 9), pick(2, 1, 10, 5), pick(3, 1, 10, 5), pick(4, 1, 10, 5), pick(5, 1, 10, 1)],
      games,
      [rank(1), rank(2), rank(3), rank(4), rank(5)],
    );

    expect(summarize(result)).toEqual([
      [1, 9, 1, 1, 0],
      [2, 5, 1, 2, 1],
      [3, 5, 1, 2, 1],
      [4, 5, 1, 2, 1],
      [5, 1, 1, 5, 0],
    ]);
  });

  it("handles a single user", () => {
    expect(summarize(sortPicks([pick(1, 1, 10, 2)], games, [rank(1)]))).toEqual([[1, 2, 1, 1, 0]]);
  });
});
