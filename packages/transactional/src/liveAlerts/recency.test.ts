import { describe, expect, it } from "vitest";

import { getRecentTransitions, hasJustEnded } from "./recency";
import { makeGame, makePlay, minutesAgo, NOW } from "./testUtils";

describe("getRecentTransitions", () => {
  it("keeps plays from the last 10 minutes with the score from the play before them", () => {
    const game = makeGame({
      plays: [
        makePlay("a", 0, 3, 1, 90),
        makePlay("b", 7, 3, 2, 12),
        makePlay("c", 7, 10, 3, 9.5),
        makePlay("d", 14, 10, 4, 1),
      ],
    });

    expect(
      getRecentTransitions(game, NOW).map(({ awayBefore, homeBefore, play }) => [play.id, homeBefore, awayBefore]),
    ).toEqual([
      ["c", 7, 3],
      ["d", 7, 10],
    ]);
  });

  it("treats the first play of a game as starting from 0-0", () => {
    const game = makeGame({ plays: [makePlay("a", 0, 3, 1, 2)] });

    expect(getRecentTransitions(game, NOW)).toMatchObject([{ awayBefore: 0, homeBefore: 0 }]);
  });

  it("ignores plays with no timestamp so old events are never announced", () => {
    const game = makeGame({ plays: [makePlay("a", 0, 3, 1, null), makePlay("b", 0, 6, 1, 1)] });

    expect(getRecentTransitions(game, NOW).map(({ play }) => play.id)).toEqual(["b"]);
  });
});

describe("hasJustEnded", () => {
  it("requires ESPN to report the game over", () => {
    expect(hasJustEnded(makeGame({ state: "in" }), NOW)).toBe(false);
  });

  it("accepts a game that ended within 30 minutes", () => {
    expect(hasJustEnded(makeGame({ endedAt: minutesAgo(29), state: "post" }), NOW)).toBe(true);
  });

  it("rejects a game that ended more than 30 minutes ago", () => {
    expect(hasJustEnded(makeGame({ endedAt: minutesAgo(31), state: "post" }), NOW)).toBe(false);
  });

  it("accepts a finished game when ESPN gives no end time", () => {
    expect(hasJustEnded(makeGame({ endedAt: null, state: "post" }), NOW)).toBe(true);
  });
});
