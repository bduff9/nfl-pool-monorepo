import { describe, expect, it } from "vitest";

import { toAdminGameRowProps } from "./gameRowProps";

const game = {
  GameHomeScore: 21,
  GameID: 7,
  GameKickoff: new Date("2025-09-07T18:00:00Z"),
  GameStatus: "Final" as const,
  GameVisitorScore: 17,
  homeTeam: { TeamName: "Packers" },
  visitorTeam: { TeamName: "Bears" },
};

describe("toAdminGameRowProps", () => {
  it("maps a populated game", () => {
    expect(toAdminGameRowProps(game)).toEqual({
      away: "Bears",
      gameID: 7,
      home: "Packers",
      homeScore: 21,
      kickoffLabel: "Sep 7, 2025, 1:00 PM",
      status: "Final",
      visitorScore: 17,
    });
  });

  it("falls back for missing teams and scores", () => {
    expect(
      toAdminGameRowProps({
        ...game,
        GameHomeScore: null,
        GameVisitorScore: null,
        homeTeam: null,
        visitorTeam: undefined,
      }),
    ).toMatchObject({ away: "Unknown", home: "Unknown", homeScore: 0, visitorScore: 0 });
  });
});
