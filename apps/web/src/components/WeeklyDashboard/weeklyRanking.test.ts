import { describe, expect, it } from "vitest";

import { buildRankingData } from "./weeklyRanking";

describe("buildRankingData", () => {
  it("omits the T prefix when not tied", () => {
    expect(buildRankingData({ Rank: 3, Tied: 0 }, 10, 0)[0]?.myPlace).toBe("3");
  });

  it("splits the field into ahead, behind and tied", () => {
    const data = buildRankingData({ Rank: 4, Tied: 1 }, 20, 2);

    expect(data.map((slice) => [slice.name, slice.value])).toEqual([
      ["ahead of me", 3],
      ["behind me", 14],
      ["tied with me", 2],
    ]);
    expect(data.every((slice) => slice.myPlace === "T4" && slice.total === 20)).toBe(true);
  });
});
