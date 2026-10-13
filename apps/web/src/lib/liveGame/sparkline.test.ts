import { describe, expect, it } from "vitest";

import { buildSparkline } from "./sparkline";

describe("buildSparkline", () => {
  it("needs at least two points", () => {
    expect(buildSparkline([], 100, 40)).toBeUndefined();
    expect(buildSparkline([50], 100, 40)).toBeUndefined();
  });

  it("spreads points across the width with 100% at the top", () => {
    expect(buildSparkline([100, 50, 0], 100, 40)).toEqual({
      endX: 100,
      endY: 40,
      midY: 20,
      points: "0,0 50,20 100,40",
    });
  });

  it("clamps values outside 0-100", () => {
    expect(buildSparkline([150, -10], 10, 10)?.points).toBe("0,0 10,10");
  });
});
