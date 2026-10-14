import { describe, expect, it } from "vitest";

import { getQuickPickLandingRoute } from "./quickPickConfirmHelpers";

describe("getQuickPickLandingRoute", () => {
  it("lands on the picks of the quick pick's week", () => {
    expect(getQuickPickLandingRoute(6)).toBe("/picks/set?week=6");
  });

  it.each([[undefined], [null], ["6"], [true]])("falls back to the plain picks route for %j", (value) => {
    expect(getQuickPickLandingRoute(value)).toBe("/picks/set");
  });
});
