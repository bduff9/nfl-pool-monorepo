import { describe, expect, it } from "vitest";

import { type DbAlertGame, type EspnGameRef, matchEspnGames, toAlertGame } from "./matchGames";

const dbGame: DbAlertGame = {
  GameID: 11,
  GameWeek: 5,
  HomeTeamID: 28,
  HomeTeamName: "Rams",
  HomeTeamShortName: "LAR",
  VisitorTeamID: 4,
  VisitorTeamName: "Bills",
  VisitorTeamShortName: "BUF",
};
const espnGame: EspnGameRef = {
  away: { score: 27, shortName: "BUF" },
  eventId: "401872994",
  home: { score: 20, shortName: "LAR" },
  state: "in",
};

describe("matchEspnGames", () => {
  it("pairs games by home and visiting team", () => {
    const reversed = { ...espnGame, away: { score: 0, shortName: "LAR" }, home: { score: 0, shortName: "BUF" } };
    const unrelated = { ...espnGame, away: { score: 0, shortName: "DAL" }, home: { score: 0, shortName: "NYG" } };

    expect(matchEspnGames([dbGame], [espnGame, reversed, unrelated])).toEqual([{ dbGame, espnGame }]);
  });
});

describe("toAlertGame", () => {
  it("combines our game with ESPN's score and scoring plays", () => {
    const plays = [{ awayScore: 7, homeScore: 0, id: "a", period: 1, wallclock: new Date("2026-10-13T00:30:00Z") }];
    const lastPlayAt = new Date("2026-10-13T00:31:00Z");

    expect(toAlertGame(dbGame, espnGame, { lastPlayAt, scoringPlays: plays })).toEqual({
      endedAt: lastPlayAt,
      eventId: "401872994",
      gameId: 11,
      home: { id: 28, name: "Rams", shortName: "LAR" },
      homeScore: 20,
      plays,
      state: "in",
      visitor: { id: 4, name: "Bills", shortName: "BUF" },
      visitorScore: 27,
      week: 5,
    });
  });
});
