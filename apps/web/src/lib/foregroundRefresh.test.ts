import { describe, expect, it } from "vitest";

import { shouldRefresh } from "./foregroundRefresh";

describe("shouldRefresh", () => {
  it("refreshes once 30 seconds have passed since the last refresh", () => {
    expect(shouldRefresh(1_000, 31_000)).toBe(true);
  });

  it("does not refresh again before 30 seconds have passed", () => {
    expect(shouldRefresh(1_000, 30_999)).toBe(false);
  });

  it("refreshes when the last refresh was long ago", () => {
    expect(shouldRefresh(0, 3_600_000)).toBe(true);
  });
});
