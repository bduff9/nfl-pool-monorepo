import { describe, expect, it } from "vitest";

import { buildWeekPicksShareText, buildWeekResultShareText, formatRankLabel } from "./shareText";

describe("share text", () => {
  it("builds the result text with an ordinal", () => {
    expect(buildWeekResultShareText(6, 3, false)).toBe("I finished 3rd in week 6 of the NFL Confidence Pool");
  });

  it("mentions ties", () => {
    expect(buildWeekResultShareText(6, 1, true)).toBe("I finished tied for 1st in week 6 of the NFL Confidence Pool");
  });

  it("builds the picks text", () => {
    expect(buildWeekPicksShareText(2)).toBe("My week 2 picks are in");
  });

  it("formats the rank label", () => {
    expect(formatRankLabel(1, 42, false)).toBe("1st of 42");
    expect(formatRankLabel(11, 42, true)).toBe("T-11th of 42");
  });
});
