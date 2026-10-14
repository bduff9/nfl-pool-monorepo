import { describe, expect, it } from "vitest";

import { getGameTransitionName } from "./gameTransitionNames";

describe("getGameTransitionName", () => {
  it("names the card after the ESPN event", () => {
    expect(getGameTransitionName("401872656")).toBe("game-401872656");
  });

  it("gives no name to a game without an event id", () => {
    expect(getGameTransitionName(undefined)).toBeUndefined();
    expect(getGameTransitionName("")).toBeUndefined();
  });
});
