import { describe, expect, it } from "vitest";

import { getBarClassName, toPercent } from "./progressBar";

describe("toPercent", () => {
  it("returns the percentage of max", () => {
    expect(toPercent(5, 20)).toBe(25);
  });

  it("returns 0 when max is not positive", () => {
    expect(toPercent(5, 0)).toBe(0);
    expect(toPercent(5, -1)).toBe(0);
  });
});

describe("getBarClassName", () => {
  it("marks the bar in progress until the season is over", () => {
    expect(getBarClassName("bar", false)).toBe("bar in-progress");
  });

  it("omits the in-progress class when over", () => {
    expect(getBarClassName("bar", true)).toBe("bar");
  });
});
