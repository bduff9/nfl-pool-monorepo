import { describe, expect, it } from "vitest";

import { getGameTransitionName, getPossessionTransitionName, getScoreTransitionName } from "./gameTransitionNames";

describe("getGameTransitionName", () => {
  it("names the card after the ESPN event", () => {
    expect(getGameTransitionName("401872656")).toBe("game-401872656");
  });

  it("gives no name to a game without an event id", () => {
    expect(getGameTransitionName(undefined)).toBeUndefined();
    expect(getGameTransitionName("")).toBeUndefined();
  });
});

describe("getPossessionTransitionName", () => {
  it("names the football after the game", () => {
    expect(getPossessionTransitionName(101)).toBe("possession-101");
  });
});

describe("getScoreTransitionName", () => {
  it("names a team's score on a game's card", () => {
    expect(getScoreTransitionName(101, 29)).toBe("score-101-29");
  });
});
