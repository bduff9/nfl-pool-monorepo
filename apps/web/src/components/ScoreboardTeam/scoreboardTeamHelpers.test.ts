import { describe, expect, it } from "vitest";

import { getLogoClasses, getPossessionClasses, getScoreboardTextClasses, isLoserOf } from "./scoreboardTeamHelpers";

describe("isLoserOf", () => {
  it("is a loser only when final and not the winner", () => {
    expect(isLoserOf(false, "Final")).toBe(true);
    expect(isLoserOf(true, "Final")).toBe(false);
    expect(isLoserOf(false, "InProgress")).toBe(false);
  });
});

describe("getScoreboardTextClasses", () => {
  it("styles winners", () => {
    expect(getScoreboardTextClasses(true, false, false)).toBe("text-green-600 font-bold");
  });

  it("styles losers", () => {
    expect(getScoreboardTextClasses(false, true, false)).toBe("text-muted-foreground");
  });

  it("lets the redzone color override the outcome color", () => {
    expect(getScoreboardTextClasses(true, false, true)).toBe("font-bold text-red-600");
    expect(getScoreboardTextClasses(false, false, true)).toBe("text-red-600");
  });

  it("adds nothing for an undecided game outside the redzone", () => {
    expect(getScoreboardTextClasses(false, false, false)).toBe("");
  });
});

describe("getLogoClasses", () => {
  it("grays out losers", () => {
    expect(getLogoClasses(true)).toBe("h-auto m-w-full grayscale");
    expect(getLogoClasses(false)).toBe("h-auto m-w-full");
  });
});

describe("getPossessionClasses", () => {
  it("uses amber outside the redzone only", () => {
    expect(getPossessionClasses(false)).toBe("me-2 text-amber-800");
    expect(getPossessionClasses(true)).toBe("me-2");
  });
});
