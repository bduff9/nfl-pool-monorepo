import { describe, expect, it } from "vitest";

import { getPercent, isPositive, showsMaxPossible } from "./progressChartHelpers";

describe("getPercent", () => {
  it("computes a percentage of max", () => {
    expect(getPercent(5, 20)).toBe(25);
  });

  it("returns zero when max is not positive", () => {
    expect(getPercent(5, 0)).toBe(0);
    expect(getPercent(5, -1)).toBe(0);
  });
});

describe("isPositive", () => {
  it("accepts only positive numbers", () => {
    expect(isPositive(3)).toBe(true);
    expect(isPositive(0)).toBe(false);
    expect(isPositive(undefined)).toBe(false);
  });
});

describe("showsMaxPossible", () => {
  it("is true only for Games and Points", () => {
    expect(showsMaxPossible("Games")).toBe(true);
    expect(showsMaxPossible("Points")).toBe(true);
    expect(showsMaxPossible("Overall Remaining")).toBe(false);
    expect(showsMaxPossible("Current Week Remaining")).toBe(false);
  });
});
