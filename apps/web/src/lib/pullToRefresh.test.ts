import { describe, expect, it } from "vitest";

import { getPullStart, getPullUpdate, hasReachedThreshold, isPullEnabledOn, PULL_THRESHOLD_PX } from "./pullToRefresh";

type Target = NonNullable<Parameters<typeof getPullStart>[1]>;

const node = (scrollTop: number, parentElement: Target | null = null, insideSelfScrolling = false): Target => ({
  closest: () => (insideSelfScrolling ? {} : null),
  parentElement,
  scrollTop,
});

const FINGER = [{ clientY: 120 }];

describe("getPullUpdate", () => {
  it("follows the finger at half speed while the page stays at the top", () => {
    expect(getPullUpdate(100, 300, 0)).toEqual({ distance: 100, startY: 100 });
  });

  it("is zero for upward drags and capped for long ones", () => {
    expect(getPullUpdate(300, 100, 0).distance).toBe(0);
    expect(getPullUpdate(0, 1000, 0).distance).toBe(110);
  });

  it("needs a deliberate pull to reach the threshold", () => {
    expect(hasReachedThreshold(getPullUpdate(0, 100, 0).distance)).toBe(false);
    expect(hasReachedThreshold(getPullUpdate(0, 150, 0).distance)).toBe(true);
  });

  it("gives up the pull once the page scrolls", () => {
    expect(getPullUpdate(100, 300, 5)).toEqual({ distance: 0, startY: null });
  });
});

describe("hasReachedThreshold", () => {
  it("is true at and beyond the threshold only", () => {
    expect(hasReachedThreshold(PULL_THRESHOLD_PX - 1)).toBe(false);
    expect(hasReachedThreshold(PULL_THRESHOLD_PX)).toBe(true);
  });
});

describe("isPullEnabledOn", () => {
  it("is off where a downward drag already moves points", () => {
    expect(isPullEnabledOn("/picks/set")).toBe(false);
    expect(isPullEnabledOn("/weekly")).toBe(true);
  });
});

describe("getPullStart", () => {
  it("starts at the finger's position from the top of a plain page", () => {
    expect(getPullStart(FINGER, node(0, node(0)), 0)).toBe(120);
  });

  it("does not start for several fingers", () => {
    expect(getPullStart([{ clientY: 1 }, { clientY: 2 }], node(0), 0)).toBeNull();
  });

  it("does not start once the page has scrolled", () => {
    expect(getPullStart(FINGER, node(0), 30)).toBeNull();
  });

  it("does not start inside a container that is scrolled down", () => {
    expect(getPullStart(FINGER, node(0, node(30)), 0)).toBeNull();
  });

  it("does not start inside dialogs, lists or draggable points", () => {
    expect(getPullStart(FINGER, node(0, null, true), 0)).toBeNull();
  });

  it("does not start without a target element", () => {
    expect(getPullStart(FINGER, null, 0)).toBeNull();
  });
});
