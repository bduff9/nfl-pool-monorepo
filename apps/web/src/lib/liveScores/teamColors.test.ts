import { describe, expect, it } from "vitest";

import { getMatchupColors } from "./teamColors";

const team = (TeamPrimaryColor: string, TeamSecondaryColor: string) => ({ TeamPrimaryColor, TeamSecondaryColor });

describe("getMatchupColors", () => {
  it("uses each team's primary color when it shows up on the dark card", () => {
    expect(getMatchupColors(team("#A30D2D", "#FFFFFF"), team("#0069B2", "#FFFFFF"))).toEqual({
      home: "#A30D2D",
      visitor: "#0069B2",
    });
  });

  it("falls back to the secondary color when the primary is too dark to see", () => {
    expect(getMatchupColors(team("#000000", "#A1042F"), team("#061E3E", "#DF6108"))).toEqual({
      home: "#A1042F",
      visitor: "#DF6108",
    });
  });

  it("moves the visitor to its other color when both teams would look the same", () => {
    // TB and KC are both red: KC switches to white
    expect(getMatchupColors(team("#BF093A", "#FFFFFF"), team("#CE0226", "#FFFFFF"))).toEqual({
      home: "#BF093A",
      visitor: "#FFFFFF",
    });
  });

  it("keeps a similar color when the visitor has no other visible option", () => {
    // NYG and BUF both fall back to white
    expect(getMatchupColors(team("#03497F", "#FFFFFF"), team("#194B8C", "#FFFFFF")).visitor).toBe("#FFFFFF");
  });

  it("uses a neutral grey for a missing team and expands 3-digit hex", () => {
    expect(getMatchupColors(null, team("#FFF", "#FFF"))).toEqual({ home: "#a3a3a3", visitor: "#FFF" });
  });
});
