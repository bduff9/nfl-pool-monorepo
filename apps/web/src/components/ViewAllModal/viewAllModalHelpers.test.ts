import { describe, expect, it } from "vitest";

import { getWinnerButtonClasses, getWinnerTeamDisplay, type WinnerTeam } from "./viewAllModalHelpers";

describe("getWinnerButtonClasses", () => {
  it("marks the selected team", () => {
    expect(getWinnerButtonClasses(true)).toContain("cursor-default bg-blue-300 border-blue-500 border-4");
  });

  it("gives unselected teams hover styling", () => {
    expect(getWinnerButtonClasses(false)).toContain("cursor-pointer hover:bg-blue-100");
  });
});

describe("getWinnerTeamDisplay", () => {
  it("uses the full name and logo path", () => {
    const team = { TeamCity: "Dallas", TeamLogo: "dal.png", TeamName: "Cowboys" } as WinnerTeam;

    expect(getWinnerTeamDisplay(team)).toEqual({
      fullName: "Dallas Cowboys",
      label: "Cowboys",
      logoSrc: "/NFLLogos/dal.png",
    });
  });

  it("abbreviates multi-word team names", () => {
    const team = { TeamCity: "Boston", TeamLogo: "b.png", TeamName: "Red Sox" } as WinnerTeam;

    expect(getWinnerTeamDisplay(team).label).toBe("RS");
  });

  it("falls back to undefined fields for a missing team", () => {
    expect(getWinnerTeamDisplay(null)).toEqual({
      fullName: "undefined undefined",
      label: undefined,
      logoSrc: "/NFLLogos/undefined",
    });
  });
});
