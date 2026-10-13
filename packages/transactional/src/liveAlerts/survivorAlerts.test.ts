import { describe, expect, it } from "vitest";

import { getSurvivorBehindAlerts, getSurvivorResultAlerts } from "./survivorAlerts";
import { BILLS, makeContext, makeGame, makePlay, minutesAgo, RAMS } from "./testUtils";

const survivorOnBills = { teamId: BILLS.id, userId: 1 };
const survivorOnRams = { teamId: RAMS.id, userId: 2 };

const behindContext = (plays: ReturnType<typeof makePlay>[], survivorPicks = [survivorOnBills, survivorOnRams]) =>
  makeContext({ games: [makeGame({ plays })], subscribers: new Set([1, 2]), survivorPicks });

describe("getSurvivorBehindAlerts", () => {
  it("alerts when the pick goes from ahead to behind in the 4th", () => {
    // BUF (visitor) led 19-14, then LAR scored: LAR 20, BUF 19
    const alerts = getSurvivorBehindAlerts(behindContext([makePlay("a", 14, 19, 3, 20), makePlay("b", 20, 19, 4, 2)]));

    expect(alerts).toEqual([
      {
        body: "BUF now trails LAR 20–19 in the 4th. Your survivor pick is in trouble.",
        key: "b",
        path: "/scoreboard/game/401872994",
        title: "Survivor Pool",
        type: "survivorBehind",
        userId: 1,
      },
    ]);
  });

  it("alerts when the pick goes from ahead to tied", () => {
    const [alert] = getSurvivorBehindAlerts(behindContext([makePlay("a", 14, 20, 3, 20), makePlay("b", 20, 20, 4, 2)]));

    expect(alert?.body).toBe("BUF and LAR are tied 20–20 in the 4th. Your survivor pick is in trouble.");
  });

  it("alerts when a tie turns into a deficit, and says overtime after regulation", () => {
    const [alert] = getSurvivorBehindAlerts(behindContext([makePlay("a", 20, 20, 4, 20), makePlay("b", 23, 20, 5, 2)]));

    expect(alert?.body).toBe("BUF now trails LAR 23–20 in overtime. Your survivor pick is in trouble.");
  });

  it("covers the home team's pick too", () => {
    const alerts = getSurvivorBehindAlerts(behindContext([makePlay("a", 21, 14, 3, 20), makePlay("b", 21, 24, 4, 2)]));

    expect(alerts.map((alert) => [alert.userId, alert.body])).toEqual([
      [2, "LAR now trails BUF 24–21 in the 4th. Your survivor pick is in trouble."],
    ]);
  });

  it("does not alert before the 4th quarter", () => {
    expect(getSurvivorBehindAlerts(behindContext([makePlay("a", 14, 19, 2, 20), makePlay("b", 20, 19, 3, 2)]))).toEqual(
      [],
    );
  });

  it("does not alert when the pick stays ahead, was already behind, or takes the lead", () => {
    const stayAhead = [makePlay("a", 0, 7, 3, 20), makePlay("b", 0, 14, 4, 2)];
    const alreadyBehind = [makePlay("a", 7, 0, 3, 20), makePlay("b", 14, 0, 4, 2)];
    const takesLead = [makePlay("a", 7, 0, 3, 20), makePlay("b", 7, 10, 4, 2)];

    for (const plays of [stayAhead, alreadyBehind, takesLead]) {
      expect(getSurvivorBehindAlerts(behindContext(plays, [survivorOnBills]))).toEqual([]);
    }
  });

  it("ignores plays older than 10 minutes", () => {
    expect(
      getSurvivorBehindAlerts(behindContext([makePlay("a", 14, 19, 3, 40), makePlay("b", 20, 19, 4, 11)])),
    ).toEqual([]);
  });

  it("skips users without live alerts turned on and picks on other games", () => {
    const context = makeContext({
      games: [makeGame({ plays: [makePlay("a", 14, 19, 3, 20), makePlay("b", 20, 19, 4, 2)] })],
      subscribers: new Set([2]),
      survivorPicks: [survivorOnBills, { teamId: 99, userId: 2 }],
    });

    expect(getSurvivorBehindAlerts(context)).toEqual([]);
  });
});

describe("getSurvivorResultAlerts", () => {
  const ended = (homeScore: number, visitorScore: number, endedAt: Date | null = minutesAgo(3)) =>
    makeContext({
      games: [makeGame({ endedAt, homeScore, state: "post", visitorScore })],
      subscribers: new Set([1, 2]),
      survivorPicks: [survivorOnBills, survivorOnRams],
    });

  it("tells survivors their team won and that they survive the week", () => {
    const alerts = getSurvivorResultAlerts(ended(20, 27));

    expect(alerts.find((alert) => alert.userId === 1)).toMatchObject({
      body: "BUF won 27–20. You survive week 5!",
      key: "401872994",
      type: "survivorResult",
    });
  });

  it("tells survivors their team lost that they are likely out", () => {
    const alerts = getSurvivorResultAlerts(ended(20, 27));

    expect(alerts.find((alert) => alert.userId === 2)?.body).toBe(
      "LAR lost 27–20. Your survivor pick is likely out (official result coming soon).",
    );
  });

  it("treats a tie as a loss, matching how the survivor pool scores it", () => {
    const alerts = getSurvivorResultAlerts(ended(24, 24));

    expect(alerts.map((alert) => alert.body)).toEqual([
      "BUF tied 24–24. Ties count as a loss in survivor, so your pick is likely out (official result coming soon).",
      "LAR tied 24–24. Ties count as a loss in survivor, so your pick is likely out (official result coming soon).",
    ]);
  });

  it("waits for ESPN to report the game over", () => {
    const context = makeContext({
      games: [makeGame({ homeScore: 20, state: "in", visitorScore: 27 })],
      subscribers: new Set([1]),
      survivorPicks: [survivorOnBills],
    });

    expect(getSurvivorResultAlerts(context)).toEqual([]);
  });

  it("ignores games that ended more than 30 minutes ago", () => {
    expect(getSurvivorResultAlerts(ended(20, 27, minutesAgo(45)))).toEqual([]);
  });

  it("skips users without live alerts turned on", () => {
    const context = { ...ended(20, 27), subscribers: new Set([2]) };

    expect(getSurvivorResultAlerts(context).map((alert) => alert.userId)).toEqual([2]);
  });
});
