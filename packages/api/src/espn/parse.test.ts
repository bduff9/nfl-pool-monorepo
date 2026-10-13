import { describe, expect, it } from "vitest";

import scoreboardFixture from "./fixtures/espnScoreboard.json";
import summaryFixture from "./fixtures/espnSummaryBufLar.json";
import { parseEspnScoreboard, parseEspnSummary } from "./parse";
import { toTeamShortName } from "./teams";

describe("toTeamShortName", () => {
  it("maps ESPN abbreviations that differ from ours and passes the rest through", () => {
    expect(toTeamShortName("KC")).toBe("KCC");
    expect(toTeamShortName("WSH")).toBe("WAS");
    expect(toTeamShortName("BUF")).toBe("BUF");
  });
});

describe("parseEspnScoreboard", () => {
  it("returns finished and live games with competitor ids, scores and our team codes", () => {
    const games = parseEspnScoreboard(scoreboardFixture);
    const bufLar = games.find((game) => game.eventId === "401872994");

    expect(games).toHaveLength(3);
    expect(bufLar).toEqual({
      away: { espnTeamId: "2", score: 37, shortName: "BUF" },
      eventId: "401872994",
      home: { espnTeamId: "14", score: 34, shortName: "LAR" },
      period: 5,
      state: "post",
    });
    expect(games.find((game) => game.eventId === "401872990")?.home.shortName).toBe("GBP");
  });

  it("skips games that have not started and events missing fields", () => {
    const pre = { competitions: [{ competitors: [], status: { type: { state: "pre" } } }], id: "1" };
    const broken = { id: "2" };
    const live = {
      competitions: [
        {
          competitors: [
            { homeAway: "home", id: "1", score: "7", team: { abbreviation: "KC" } },
            { homeAway: "away", id: "2", score: "3", team: { abbreviation: "BUF" } },
          ],
          status: { period: 2, type: { state: "in" } },
        },
      ],
      id: "3",
    };

    expect(parseEspnScoreboard({ events: [pre, broken, null, live] })).toEqual([
      {
        away: { espnTeamId: "2", score: 3, shortName: "BUF" },
        eventId: "3",
        home: { espnTeamId: "1", score: 7, shortName: "KCC" },
        period: 2,
        state: "in",
      },
    ]);
  });

  it("returns nothing for an unrecognised response", () => {
    expect(parseEspnScoreboard(null)).toEqual([]);
    expect(parseEspnScoreboard({ events: "nope" })).toEqual([]);
  });
});

describe("parseEspnSummary", () => {
  it("reads scoring plays in order with wallclocks looked up from the drive plays", () => {
    const { lastPlayAt, scoringPlays } = parseEspnSummary(summaryFixture);

    expect(scoringPlays).toHaveLength(12);
    expect(scoringPlays[6]).toMatchObject({
      awayScore: 19,
      homeScore: 20,
      id: "4018729943307",
      period: 4,
      scoringTeamId: "14",
    });
    expect(scoringPlays[6]?.wallclock?.toISOString()).toBe("2026-10-13T02:38:23.000Z");
    expect(lastPlayAt?.toISOString()).toBe("2026-10-13T03:47:02.000Z");
  });

  it("keeps a scoring play's own wallclock and tolerates plays it cannot read", () => {
    const summary = parseEspnSummary({
      drives: { current: { plays: [{ id: "a", wallclock: "2026-10-11T18:00:00Z" }] }, previous: [{ plays: "bad" }] },
      scoringPlays: [
        { awayScore: 0, homeScore: 7, id: "a", period: { number: 1 }, team: { id: "1" }, text: "TD" },
        { awayScore: 0, homeScore: 7, id: "b", period: { number: 1 }, team: { id: "1" }, wallclock: "bad date" },
        { id: "broken" },
      ],
    });

    expect(summary.scoringPlays.map((play) => [play.id, play.wallclock?.toISOString() ?? null])).toEqual([
      ["a", "2026-10-11T18:00:00.000Z"],
      ["b", null],
    ]);
  });

  it("returns an empty summary for an unrecognised response", () => {
    expect(parseEspnSummary("nope")).toEqual({ lastPlayAt: null, scoringPlays: [] });
  });
});
