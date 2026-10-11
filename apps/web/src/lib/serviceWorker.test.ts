import { describe, expect, it } from "vitest";

import { isWarmDue } from "./serviceWorker";

const NOW = 10_000_000;
const state = { at: NOW - 60_000, userId: 1, week: 6 };

describe("isWarmDue", () => {
  it("is due when nothing has been saved yet", () => {
    expect(isWarmDue(null, 1, 6, NOW)).toBe(true);
  });

  it("is not due again right after a warm for the same user and week", () => {
    expect(isWarmDue(state, 1, 6, NOW)).toBe(false);
  });

  it("is due when the last warm is older than 30 minutes", () => {
    expect(isWarmDue({ ...state, at: NOW - 31 * 60 * 1000 }, 1, 6, NOW)).toBe(true);
  });

  it("is due when the week changed", () => {
    expect(isWarmDue(state, 1, 7, NOW)).toBe(true);
    expect(isWarmDue(state, 1, null, NOW)).toBe(true);
  });

  it("is due when a different user signed in", () => {
    expect(isWarmDue(state, 2, 6, NOW)).toBe(true);
  });
});
