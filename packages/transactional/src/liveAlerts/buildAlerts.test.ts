import type { ProjectionGame } from "@nfl-pool-monorepo/utils/projections";
import { describe, expect, it } from "vitest";

import { buildLiveAlerts, buildProjectionGames } from "./buildAlerts";
import { BILLS, makeContext, makeGame, makePlay, minutesAgo, RAMS } from "./testUtils";

const dbGame = (overrides: Partial<ProjectionGame> = {}): ProjectionGame => ({
  GameHomeScore: 0,
  GameID: 1,
  GameStatus: "Pregame",
  GameVisitorScore: 0,
  HomeTeamID: RAMS.id,
  VisitorTeamID: BILLS.id,
  WinnerTeamID: null,
  ...overrides,
});

describe("buildProjectionGames", () => {
  it("overlays ESPN's current score on a game the database has not finalized", () => {
    const [game] = buildProjectionGames([dbGame()], [makeGame({ homeScore: 17, visitorScore: 20 })]);

    expect(game).toMatchObject({
      GameHomeScore: 17,
      GameStatus: "In Progress",
      GameVisitorScore: 20,
      WinnerTeamID: null,
    });
  });

  it("marks a game ESPN says is over as final with its winner, and no winner for a tie", () => {
    const [won] = buildProjectionGames([dbGame()], [makeGame({ homeScore: 17, state: "post", visitorScore: 20 })]);
    const [tied] = buildProjectionGames([dbGame()], [makeGame({ homeScore: 20, state: "post", visitorScore: 20 })]);

    expect(won).toMatchObject({ GameStatus: "Final", WinnerTeamID: BILLS.id });
    expect(tied).toMatchObject({ GameStatus: "Final", WinnerTeamID: null });
  });

  it("keeps the database's official result and leaves games without an ESPN match alone", () => {
    const official = dbGame({ GameStatus: "Final", WinnerTeamID: RAMS.id });
    const other = dbGame({ GameID: 9 });

    expect(buildProjectionGames([official, other], [makeGame({ homeScore: 1, visitorScore: 2 })])).toEqual([
      official,
      other,
    ]);
  });
});

describe("buildLiveAlerts", () => {
  it("combines every rule's alerts", () => {
    const alerts = buildLiveAlerts(
      makeContext({
        games: [
          makeGame({
            endedAt: minutesAgo(1),
            homeScore: 20,
            plays: [makePlay("a", 14, 19, 3, 20), makePlay("b", 20, 19, 4, 2)],
            state: "post",
            visitorScore: 19,
          }),
        ],
        picks: [
          { GameID: 1, PickPoints: 16, TeamID: RAMS.id, UserID: 1 },
          { GameID: 1, PickPoints: 5, TeamID: BILLS.id, UserID: 3 },
        ],
        projectionGames: [dbGame()],
        subscribers: new Set([1, 2]),
        survivorPicks: [{ teamId: BILLS.id, userId: 2 }],
      }),
    );

    expect(alerts.map((alert) => [alert.type, alert.userId]).sort()).toEqual([
      ["leadChange", 1],
      ["pointsEarned", 1],
      ["rankChange", 1],
      ["survivorBehind", 2],
      ["survivorResult", 2],
    ]);
  });
});
