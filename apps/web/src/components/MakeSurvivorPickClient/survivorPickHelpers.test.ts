import { describe, expect, it } from "vitest";

import {
  getPreviousTeamId,
  getSavingToastMessage,
  getShownSurvivorPicks,
  isPendingPickCurrent,
} from "./survivorPickHelpers";

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

describe("getShownSurvivorPicks", () => {
  const server = [
    { SurvivorPickWeek: 1, TeamID: 4 },
    { SurvivorPickWeek: 2, TeamID: 7 },
  ];

  it("shows the pending team on the week's pick while the server's pick is the one it was made against", () => {
    expect(getShownSurvivorPicks({ baseTeamId: 7, teamId: 9 }, server, 2)).toEqual([
      { SurvivorPickWeek: 1, TeamID: 4 },
      { SurvivorPickWeek: 2, TeamID: 9 },
    ]);
  });

  it("keeps the pending team through a refresh that brings the same picks in a new array", () => {
    const refreshed = server.map((pick) => ({ ...pick }));

    expect(isPendingPickCurrent({ baseTeamId: 7, teamId: 9 }, refreshed, 2)).toBe(true);
    expect(getShownSurvivorPicks({ baseTeamId: 7, teamId: 9 }, refreshed, 2)[1]?.TeamID).toBe(9);
  });

  it("shows the server's picks once a failed pick is rolled back to the team it was made against", () => {
    expect(getShownSurvivorPicks({ baseTeamId: 7, teamId: 7 }, server, 2)).toEqual(server);
  });

  it("lets the server's pick win once it has changed, and without a pending pick", () => {
    const changed = [
      { SurvivorPickWeek: 1, TeamID: 4 },
      { SurvivorPickWeek: 2, TeamID: 11 },
    ];

    expect(isPendingPickCurrent({ baseTeamId: 7, teamId: 9 }, changed, 2)).toBe(false);
    expect(getShownSurvivorPicks({ baseTeamId: 7, teamId: 9 }, changed, 2)).toBe(changed);
    expect(getShownSurvivorPicks(null, server, 2)).toBe(server);
    expect(isPendingPickCurrent(null, server, 2)).toBe(false);
  });
});
