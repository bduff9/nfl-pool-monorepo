import { describe, expect, it } from "vitest";

import { getPreviousTeamId, getSavingToastMessage } from "./survivorPickHelpers";

describe("getPreviousTeamId", () => {
  const picks = [
    { SurvivorPickWeek: 1, TeamID: 4 },
    { SurvivorPickWeek: 2, TeamID: null },
  ];

  it("returns the team picked for the week", () => {
    expect(getPreviousTeamId(picks, 1)).toBe(4);
  });

  it("returns null when the week's pick has no team", () => {
    expect(getPreviousTeamId(picks, 2)).toBeNull();
  });

  it("returns null when there is no pick for the week", () => {
    expect(getPreviousTeamId(picks, 9)).toBeNull();
  });
});

describe("getSavingToastMessage", () => {
  it("explains the pick is queued while offline", () => {
    expect(getSavingToastMessage(true)).toContain("offline");
  });

  it("shows the saving message while online", () => {
    expect(getSavingToastMessage(false)).toBe("Saving survivor pick...");
  });
});
