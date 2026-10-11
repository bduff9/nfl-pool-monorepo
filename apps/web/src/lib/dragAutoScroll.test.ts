import { describe, expect, it } from "vitest";

import { getScrollDelta } from "./dragAutoScroll";

describe("getScrollDelta", () => {
  it("does not scroll when the pointer is away from the edges", () => {
    expect(getScrollDelta(300, 100, 700)).toBe(0);
  });

  it("scrolls up near the top edge, faster the closer it gets", () => {
    const nearer = getScrollDelta(110, 100, 700);
    const farther = getScrollDelta(150, 100, 700);

    expect(farther).toBeLessThan(0);
    expect(nearer).toBeLessThan(farther);
  });

  it("scrolls down near the bottom edge", () => {
    expect(getScrollDelta(690, 100, 700)).toBeGreaterThan(0);
  });

  it("scrolls at full speed when the pointer is past the edge", () => {
    expect(getScrollDelta(900, 100, 700)).toBe(16);
    expect(getScrollDelta(0, 100, 700)).toBe(-16);
  });
});
