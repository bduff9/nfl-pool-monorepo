import type { ProjectionGame, ProjectionPick } from "@nfl-pool-monorepo/utils/projections";
import { describe, expect, it } from "vitest";

import { getRankChangeAlerts } from "./rankAlerts";
import { BILLS, makeContext, makeGame, makePlay, RAMS } from "./testUtils";

const live: ProjectionGame = {
  GameHomeScore: 20,
  GameID: 1,
  GameStatus: "In Progress",
  GameVisitorScore: 27,
  HomeTeamID: RAMS.id,
  VisitorTeamID: BILLS.id,
  WinnerTeamID: null,
};
const final: ProjectionGame = {
  GameHomeScore: 10,
  GameID: 2,
  GameStatus: "Final",
  GameVisitorScore: 3,
  HomeTeamID: 40,
  VisitorTeamID: 41,
  WinnerTeamID: 40,
};
const pregame: ProjectionGame = { ...live, GameHomeScore: 0, GameID: 3, GameStatus: "Pregame", GameVisitorScore: 0 };

const pick = (UserID: number, GameID: number, TeamID: number, PickPoints: number): ProjectionPick => ({
  GameID,
  PickPoints,
  TeamID,
  UserID,
});

// Totals when BUF leads: u3 19, u6 17, u5 15, u4 0. Totals when LAR leads: u6 19, u4 15, u5 12, u3 5.
const picks = [
  pick(3, 1, BILLS.id, 14),
  pick(3, 2, 40, 5),
  pick(4, 1, RAMS.id, 15),
  pick(4, 2, 41, 1),
  pick(5, 1, BILLS.id, 3),
  pick(5, 2, 40, 12),
  pick(6, 1, RAMS.id, 2),
  pick(6, 2, 40, 17),
  pick(6, 3, 50, 9),
];

const context = (plays: ReturnType<typeof makePlay>[], subscribers = [3, 4, 5, 6]) =>
  makeContext({
    games: [makeGame({ homeScore: 20, plays, visitorScore: 27 })],
    picks,
    projectionGames: [live, final, pregame],
    subscribers: new Set(subscribers),
  });

// BUF led 19-14 in the 3rd, LAR retook the lead 20-19, then BUF scored again to lead 27-20
const plays = [makePlay("p0", 14, 19, 3, 30), makePlay("p1", 20, 19, 4, 8), makePlay("p2", 20, 27, 4, 1)];

const bodiesByUser = (alerts: ReturnType<typeof getRankChangeAlerts>, key: string) =>
  Object.fromEntries(alerts.filter((alert) => alert.key === key).map((alert) => [alert.userId, alert.body]));

describe("getRankChangeAlerts", () => {
  it("tells each user when a lead change moves them into or out of 1st or the top two", () => {
    const alerts = getRankChangeAlerts(context(plays));

    // LAR retakes the lead: u6 moves into 1st, u4 up into 2nd, u3 falls out of the top two; u5 stays 3rd
    expect(bodiesByUser(alerts, "p1")).toEqual({
      3: "You've dropped to projected 4th for week 5.",
      4: "You've moved up to projected 2nd for week 5.",
      6: "You're now projected 1st for week 5!",
    });
    // BUF retakes it: u3 moves into 1st, u6 drops to 2nd, u4 falls out of the top two
    expect(bodiesByUser(alerts, "p2")).toEqual({
      3: "You're now projected 1st for week 5!",
      4: "You've dropped to projected 4th for week 5.",
      6: "You've dropped to projected 2nd for week 5.",
    });
  });

  it("links to the week's scoreboard and only describes the recipient's own standing", () => {
    const alerts = getRankChangeAlerts(context(plays));

    expect(alerts.every((alert) => alert.path === "/scoreboard?week=5" && alert.type === "rankChange")).toBe(true);
    expect(alerts.every((alert) => !/\b(u\d|Brian|team)\b/.test(alert.body))).toBe(true);
  });

  it("only alerts users who have live game alerts turned on", () => {
    const alerts = getRankChangeAlerts(context(plays, [6]));

    expect(alerts.map((alert) => [alert.key, alert.userId])).toEqual([
      ["p1", 6],
      ["p2", 6],
    ]);
  });

  it("ignores scoring plays that do not change which team leads", () => {
    expect(getRankChangeAlerts(context([makePlay("p0", 0, 7, 1, 30), makePlay("p1", 0, 14, 2, 1)]))).toEqual([]);
  });

  it("ignores plays older than 10 minutes", () => {
    expect(getRankChangeAlerts(context([makePlay("p0", 14, 19, 3, 30), makePlay("p1", 20, 19, 4, 11)]))).toEqual([]);
  });

  it("counts a lead turning into a tie and gives tied users a shared rank", () => {
    const tie = getRankChangeAlerts(
      makeContext({
        games: [makeGame({ plays: [makePlay("a", 20, 27, 4, 30), makePlay("t", 27, 27, 4, 1)] })],
        picks: [pick(1, 1, BILLS.id, 5), pick(2, 1, RAMS.id, 5), pick(2, 2, 40, 0)],
        projectionGames: [live, final],
        subscribers: new Set([1, 2]),
      }),
    );

    // Before the tie u1 leads alone with 5 and u2 has 0; after it both have 0 and share 1st
    expect(tie.map((alert) => [alert.userId, alert.body])).toEqual([
      [2, "You're now projected 1st (tied) for week 5!"],
    ]);
  });

  it("uses the current ESPN state of the week's other games for everyone else", () => {
    const otherLive: ProjectionGame = {
      ...live,
      GameHomeScore: 0,
      GameID: 7,
      GameVisitorScore: 10,
      HomeTeamID: 60,
      VisitorTeamID: 61,
    };
    const result = getRankChangeAlerts(
      makeContext({
        games: [makeGame({ plays: [makePlay("a", 20, 27, 4, 30), makePlay("b", 28, 27, 4, 1)] })],
        picks: [pick(1, 1, RAMS.id, 5), pick(1, 7, 61, 3), pick(2, 1, BILLS.id, 5), pick(2, 7, 60, 3)],
        projectionGames: [live, otherLive],
        subscribers: new Set([1, 2]),
      }),
    );

    // The other game currently favours team 61 (u1's pick): u1 has 3 vs u2's 5 until LAR retakes the lead, then 8 vs 0
    expect(result.map((alert) => [alert.userId, alert.body])).toEqual([
      [1, "You're now projected 1st for week 5!"],
      [2, "You've dropped to projected 2nd for week 5."],
    ]);
  });
});
