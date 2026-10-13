import { describe, expect, it } from "vitest";

import { attachEventIds, type EventIdGame, hasFinalGame } from "./attachEventIds";

const eventIds = { "BAL@ATL": "401872993" };
const team = (TeamShortName: string) => ({ TeamShortName });
const game = (GameStatus: string, extra: Partial<EventIdGame> = {}): EventIdGame => ({
  GameStatus,
  homeTeam: team("ATL"),
  visitorTeam: team("BAL"),
  ...extra,
});

describe("attachEventIds", () => {
  it("adds the event id to a final game without one", () => {
    expect(attachEventIds([game("Final")], eventIds)[0]?.espnEventId).toBe("401872993");
  });

  it("leaves live and pregame games alone", () => {
    const games = [game("Pregame"), game("3rd Quarter")];

    expect(attachEventIds(games, eventIds)).toEqual(games);
  });

  it("keeps an event id the overlay already set", () => {
    expect(attachEventIds([game("Final", { espnEventId: "1" })], eventIds)[0]?.espnEventId).toBe("1");
  });

  it("leaves final games with no match or missing teams unchanged", () => {
    const games = [game("Final", { homeTeam: team("NYJ") }), game("Final", { visitorTeam: null })];

    expect(attachEventIds(games, eventIds)).toEqual(games);
  });
});

describe("hasFinalGame", () => {
  it("is true only when a game is final", () => {
    expect(hasFinalGame([game("Pregame"), game("Final")])).toBe(true);
    expect(hasFinalGame([game("Pregame")])).toBe(false);
  });
});
