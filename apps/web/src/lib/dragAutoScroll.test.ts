import { describe, expect, it } from "vitest";

import { createDwellGate, getScrollDelta } from "./dragAutoScroll";

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

  it("scrolls at full speed at the top edge and past the bottom edge", () => {
    expect(getScrollDelta(100, 100, 700)).toBe(-16);
    expect(getScrollDelta(900, 100, 700)).toBe(16);
  });

  it("does not scroll when the pointer is above the list, over the point bank", () => {
    expect(getScrollDelta(99, 100, 700)).toBe(0);
    expect(getScrollDelta(0, 100, 700)).toBe(0);
  });
});

describe("createDwellGate", () => {
  it("holds back a delta until the pointer has rested in the edge zone for the dwell", () => {
    const gate = createDwellGate();

    expect(gate(-10, 1000)).toBe(0);
    expect(gate(-10, 1200)).toBe(0);
    expect(gate(-10, 1300)).toBe(-10);
    expect(gate(-12, 1400)).toBe(-12);
  });

  it("starts the wait over when the pointer leaves the edge zone", () => {
    const gate = createDwellGate();

    gate(10, 1000);
    expect(gate(0, 1250)).toBe(0);
    expect(gate(10, 1300)).toBe(0);
    expect(gate(10, 1500)).toBe(0);
    expect(gate(10, 1600)).toBe(10);
  });

  it("does not scroll for a pointer passing straight through the zone", () => {
    const gate = createDwellGate();

    expect(gate(-16, 0)).toBe(0);
    expect(gate(-8, 64)).toBe(0);
    expect(gate(0, 128)).toBe(0);
    expect(gate(0, 700)).toBe(0);
  });
});
