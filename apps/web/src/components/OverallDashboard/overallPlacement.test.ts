import { describe, expect, it } from "vitest";

import { getOverallPieData, getOverallPlacement } from "./overallPlacement";

describe("getOverallPlacement", () => {
  it("computes ahead and behind counts for an untied rank", () => {
    expect(getOverallPlacement({ Rank: 3, Tied: 0 }, 10, 1)).toEqual({ aheadOfMe: 2, behindMe: 6, myPlace: "3" });
  });

  it("prefixes tied places with T", () => {
    expect(getOverallPlacement({ Rank: 3, Tied: 1 }, 10, 2).myPlace).toBe("T3");
  });

  it("treats a missing rank as 0", () => {
    expect(getOverallPlacement(undefined, 10, 0)).toEqual({ aheadOfMe: -1, behindMe: 10, myPlace: "undefined" });
  });
});

describe("getOverallPieData", () => {
  it("builds the three slices in order", () => {
    const data = getOverallPieData("T3", 10, 2, 6, 2);

    expect(data.map((slice) => [slice.name, slice.value])).toEqual([
      ["ahead of me", 2],
      ["behind me", 6],
      ["tied with me", 2],
    ]);
    expect(data.every((slice) => slice.myPlace === "T3" && slice.total === 10)).toBe(true);
  });
});
