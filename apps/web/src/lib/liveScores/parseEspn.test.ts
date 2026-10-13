import { describe, expect, it } from "vitest";

import liveFixture from "./espnLiveGame.fixture.json";
import fixture from "./espnScoreboard.fixture.json";
import { getLiveScoreKey, parseEspnScoreboard } from "./parseEspn";

// The fixture holds two finished games and one scheduled game captured from ESPN's real scoreboard.
const finalGame = fixture.events.find((event) => event.status.type.state === "post");
const scheduledGame = fixture.events.find((event) => event.status.type.state === "pre");

if (!finalGame || !scheduledGame) {
  throw new Error("fixture must contain a final and a scheduled game");
}

const liveGame = {
  ...scheduledGame,
  competitions: [
    {
      competitors: scheduledGame.competitions
        .flatMap((competition) => competition.competitors)
        .map((competitor, index) => ({
          ...competitor,
          score: index === 0 ? "17" : "13",
        })),
    },
  ],
  status: {
    clock: 421,
    displayClock: "7:01",
    period: 3,
    type: { completed: false, id: "2", name: "STATUS_IN_PROGRESS", shortDetail: "7:01 - 3rd", state: "in" },
  },
};

describe("parseEspnScoreboard", () => {
  it("omits scheduled games and keeps finished games marked final", () => {
    const result = parseEspnScoreboard({ ...fixture, events: [scheduledGame, finalGame] });

    expect(Object.values(result)).toEqual([expect.objectContaining({ final: true })]);
  });

  it("returns in-progress games keyed by visitor@home with our team codes", () => {
    const result = parseEspnScoreboard({ ...fixture, events: [finalGame, liveGame] });

    expect(Object.keys(result)).toContain(getLiveScoreKey("BAL", "ATL"));
    expect(result["BAL@ATL"]).toEqual({
      clock: "7:01",
      detail: "7:01 - 3rd",
      final: false,
      homeScore: 17,
      inRedZone: false,
      period: 3,
      possession: null,
      visitorScore: 13,
    });
  });

  it("maps ESPN abbreviations that differ from ours", () => {
    const gbJax = {
      ...liveGame,
      competitions: [
        {
          competitors: [
            { homeAway: "home", score: "3", team: { abbreviation: "GB" } },
            { homeAway: "away", score: "0", team: { abbreviation: "JAX" } },
          ],
        },
      ],
    };

    expect(Object.keys(parseEspnScoreboard({ events: [gbJax] }))).toEqual(["JAC@GBP"]);
  });

  it("tolerates unknown fields", () => {
    expect(() => parseEspnScoreboard({ ...fixture, events: [liveGame], somethingNew: { a: 1 } })).not.toThrow();
  });

  it("throws on a schema mismatch", () => {
    expect(() => parseEspnScoreboard({ events: "nope" })).toThrow(/schema mismatch/);
    expect(() => parseEspnScoreboard(null)).toThrow(/schema mismatch/);
  });

  it("reads possession and red zone from a real live game (BUF at LAR, Monday night)", () => {
    expect(parseEspnScoreboard(liveFixture)["BUF@LAR"]).toMatchObject({
      inRedZone: true,
      possession: "home",
      visitorScore: 19,
    });
  });

  it("reports no possession when ESPN names a team that isn't playing", () => {
    const [event] = liveFixture.events;
    const competition = event?.competitions[0];
    const stray = { events: [{ ...event, competitions: [{ ...competition, situation: { possession: "99" } }] }] };

    expect(parseEspnScoreboard(stray)["BUF@LAR"]?.possession).toBeNull();
  });
});
