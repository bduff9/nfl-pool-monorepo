import { describe, expect, it } from "vitest";

import { getTeamLabel } from "./teamLabel";

describe("getTeamLabel", () => {
  it("joins city and name", () => {
    expect(getTeamLabel({ TeamCity: "Green Bay", TeamName: "Packers" })).toBe("Green Bay Packers");
  });

  it("trims when a part is missing", () => {
    expect(getTeamLabel({ TeamCity: null, TeamName: "Packers" })).toBe("Packers");
    expect(getTeamLabel({ TeamCity: "Green Bay", TeamName: null })).toBe("Green Bay");
  });

  it("returns an empty string without a team", () => {
    expect(getTeamLabel(null)).toBe("");
    expect(getTeamLabel(undefined)).toBe("");
  });
});
