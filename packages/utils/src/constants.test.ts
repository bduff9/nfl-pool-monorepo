import { describe, expect, it } from "vitest";

import { WEEKS_IN_SEASON } from "./constants";

describe("constants", () => {
  it("defines NFL regular season weeks", () => {
    expect(WEEKS_IN_SEASON).toBe(18);
  });
});
