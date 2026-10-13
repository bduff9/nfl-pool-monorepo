import { describe, expect, it } from "vitest";

import { getLeadChangeAlerts, getPointsEarnedAlerts } from "./confidenceAlerts";
import { BILLS, makeContext, makeGame, makePlay, minutesAgo, RAMS } from "./testUtils";

const pick = (UserID: number, TeamID: number, PickPoints: number, GameID = 1) => ({
  GameID,
  PickPoints,
  TeamID,
  UserID,
});

// User 1's picks across the week: the game of interest carries 12 points, plus 16, 15 and 13 elsewhere.
const heavyPicks = [pick(1, BILLS.id, 12), pick(1, 40, 16, 2), pick(1, 41, 15, 3), pick(1, 42, 13, 4)];

const leadContext = (plays: ReturnType<typeof makePlay>[], picks = [pick(1, BILLS.id, 16), pick(2, RAMS.id, 3)]) =>
  makeContext({ games: [makeGame({ plays })], picks, subscribers: new Set([1, 2]) });

describe("getLeadChangeAlerts", () => {
  it("alerts when the lead changes hands in the 4th, saying whether the pick is now winning or losing", () => {
    // BUF led 19-14, LAR retook the lead 20-19
    const alerts = getLeadChangeAlerts(leadContext([makePlay("a", 14, 19, 3, 20), makePlay("b", 20, 19, 4, 2)]));

    expect(alerts.map(({ body, key, userId }) => ({ body, key, userId }))).toEqual([
      { body: "LAR takes a 20–19 lead over BUF in the 4th — your 16-point pick is now losing.", key: "b", userId: 1 },
      { body: "LAR takes a 20–19 lead over BUF in the 4th — your 3-point pick is now winning.", key: "b", userId: 2 },
    ]);
  });

  it("alerts when a tie is broken, but not when a lead shrinks to a tie", () => {
    const tieBroken = getLeadChangeAlerts(leadContext([makePlay("a", 20, 20, 4, 30), makePlay("b", 20, 23, 4, 2)]));
    const leadToTie = getLeadChangeAlerts(leadContext([makePlay("a", 14, 20, 3, 30), makePlay("b", 20, 20, 4, 2)]));

    expect(tieBroken.map((alert) => alert.body)).toEqual([
      "BUF takes a 23–20 lead over LAR in the 4th — your 16-point pick is now winning.",
      "BUF takes a 23–20 lead over LAR in the 4th — your 3-point pick is now losing.",
    ]);
    expect(leadToTie).toEqual([]);
  });

  it("does not alert when the leader just extends the lead", () => {
    expect(getLeadChangeAlerts(leadContext([makePlay("a", 0, 7, 3, 20), makePlay("b", 0, 14, 4, 2)]))).toEqual([]);
  });

  it("does not alert before the 4th quarter", () => {
    expect(getLeadChangeAlerts(leadContext([makePlay("a", 0, 7, 2, 20), makePlay("b", 10, 7, 3, 2)]))).toEqual([]);
  });

  it("says overtime for plays after regulation", () => {
    const [alert] = getLeadChangeAlerts(leadContext([makePlay("a", 20, 20, 4, 20), makePlay("b", 20, 23, 5, 2)]));

    expect(alert?.body).toContain("in overtime");
  });

  it("only covers a user's three highest-point picks of the week", () => {
    const outsideTop = getLeadChangeAlerts(
      makeContext({
        games: [makeGame({ plays: [makePlay("a", 14, 19, 3, 20), makePlay("b", 20, 19, 4, 2)] })],
        picks: heavyPicks,
        subscribers: new Set([1]),
      }),
    );
    const insideTop = getLeadChangeAlerts(
      makeContext({
        games: [makeGame({ plays: [makePlay("a", 14, 19, 3, 20), makePlay("b", 20, 19, 4, 2)] })],
        picks: [...heavyPicks.slice(0, 3)],
        subscribers: new Set([1]),
      }),
    );

    expect(outsideTop).toEqual([]);
    expect(insideTop.map((alert) => alert.userId)).toEqual([1]);
  });

  it("skips users without live alerts turned on and ignores old plays", () => {
    const plays = [makePlay("a", 14, 19, 3, 40), makePlay("b", 20, 19, 4, 12)];

    expect(getLeadChangeAlerts(leadContext(plays))).toEqual([]);
    expect(
      getLeadChangeAlerts({
        ...leadContext([makePlay("a", 14, 19, 3, 20), makePlay("b", 20, 19, 4, 2)]),
        subscribers: new Set<number>(),
      }),
    ).toEqual([]);
  });
});

describe("getPointsEarnedAlerts", () => {
  const ended = (homeScore: number, visitorScore: number, endedAt: Date | null = minutesAgo(2)) =>
    makeContext({
      games: [makeGame({ endedAt, homeScore, state: "post", visitorScore })],
      picks: [pick(1, BILLS.id, 13), pick(2, RAMS.id, 9), pick(3, BILLS.id, 1), pick(4, BILLS.id, 7)],
      subscribers: new Set([1, 2, 3]),
    });

  it("tells users who picked the winner how many points they earned", () => {
    const alerts = getPointsEarnedAlerts(ended(20, 27));

    expect(alerts.map(({ body, key, type, userId }) => ({ body, key, type, userId }))).toEqual([
      {
        body: "You just earned 13 points: the Bills beat the Rams 27–20.",
        key: "401872994",
        type: "pointsEarned",
        userId: 1,
      },
      {
        body: "You just earned 1 point: the Bills beat the Rams 27–20.",
        key: "401872994",
        type: "pointsEarned",
        userId: 3,
      },
    ]);
  });

  it("awards nobody on a tie", () => {
    expect(getPointsEarnedAlerts(ended(24, 24))).toEqual([]);
  });

  it("waits for the game to end and ignores old endings", () => {
    expect(getPointsEarnedAlerts({ ...ended(20, 27), games: [makeGame({ homeScore: 20, visitorScore: 27 })] })).toEqual(
      [],
    );
    expect(getPointsEarnedAlerts(ended(20, 27, minutesAgo(31)))).toEqual([]);
  });
});
