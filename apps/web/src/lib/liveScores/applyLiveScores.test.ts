import { describe, expect, it } from "vitest";

import { applyLiveScores, isLiveCandidate, type OverlayableGame } from "./applyLiveScores";

const NOW = new Date("2026-10-11T21:00:00Z");

const makeGame = (overrides: Partial<OverlayableGame> = {}): OverlayableGame => ({
  GameHasPossession: 1,
  GameHomeScore: 7,
  GameInRedzone: 1,
  GameKickoff: new Date("2026-10-11T20:25:00Z"),
  GameStatus: "1st Quarter",
  GameTimeLeftInQuarter: "3:00",
  GameVisitorScore: 3,
  HomeTeamID: 28,
  homeTeam: { TeamShortName: "SEA" },
  VisitorTeamID: 29,
  visitorTeam: { TeamShortName: "SFO" },
  ...overrides,
});

const LIVE = {
  "SFO@SEA": {
    clock: "9:12",
    detail: "9:12 - 2nd",
    final: false,
    homeScore: 14,
    inRedZone: false,
    period: 2,
    possession: null,
    visitorScore: 10,
  },
};

describe("isLiveCandidate", () => {
  it("is false for final games and pregames before kickoff", () => {
    expect(isLiveCandidate(makeGame({ GameStatus: "Final" }), NOW)).toBe(false);
    expect(
      isLiveCandidate(makeGame({ GameKickoff: new Date("2026-10-11T22:00:00Z"), GameStatus: "Pregame" }), NOW),
    ).toBe(false);
  });

  it("is true for in-progress games and for pregames past kickoff", () => {
    expect(isLiveCandidate(makeGame(), NOW)).toBe(true);
    expect(isLiveCandidate(makeGame({ GameStatus: "Pregame" }), NOW)).toBe(true);
  });

  it("ignores pregames that kicked off long ago", () => {
    expect(
      isLiveCandidate(makeGame({ GameKickoff: new Date("2026-10-04T17:00:00Z"), GameStatus: "Pregame" }), NOW),
    ).toBe(false);
  });
});

describe("applyLiveScores", () => {
  it("overlays score, status and clock on a live game with a match", () => {
    const [game] = applyLiveScores([makeGame()], LIVE, NOW);

    expect(game).toMatchObject({
      GameHasPossession: null,
      GameHomeScore: 14,
      GameInRedzone: null,
      GameStatus: "2nd Quarter",
      GameTimeLeftInQuarter: "9:12",
      GameVisitorScore: 10,
      isLiveOverlay: true,
    });
  });

  it("maps ESPN possession and red zone to the team ID, like the official feed", () => {
    const visitorDriving = { "SFO@SEA": { ...LIVE["SFO@SEA"], inRedZone: true, possession: "visitor" as const } };
    const homeBall = { "SFO@SEA": { ...LIVE["SFO@SEA"], possession: "home" as const } };

    expect(applyLiveScores([makeGame()], visitorDriving, NOW)[0]).toMatchObject({
      GameHasPossession: 29,
      GameInRedzone: 29,
    });
    expect(applyLiveScores([makeGame()], homeBall, NOW)[0]).toMatchObject({
      GameHasPossession: 28,
      GameInRedzone: null,
    });
  });

  it("clears possession once ESPN reports the game over", () => {
    const over = { "SFO@SEA": { ...LIVE["SFO@SEA"], final: true, inRedZone: true, possession: "home" as const } };

    expect(applyLiveScores([makeGame()], over, NOW)[0]).toMatchObject({ GameHasPossession: null, GameInRedzone: null });
  });

  it("overlays a pregame row whose kickoff has passed", () => {
    const [game] = applyLiveScores([makeGame({ GameHomeScore: 0, GameStatus: "Pregame" })], LIVE, NOW);

    expect(game?.isLiveOverlay).toBe(true);
    expect(game?.GameStatus).toBe("2nd Quarter");
  });

  it("never touches final games, even with an ESPN match", () => {
    const original = makeGame({ GameStatus: "Final" });
    const [game] = applyLiveScores([original], LIVE, NOW);

    expect(game).toEqual({ ...original, isLiveOverlay: false });
  });

  it("returns games unchanged when there is no match", () => {
    const original = makeGame();

    expect(applyLiveScores([original], {}, NOW)).toEqual([{ ...original, isLiveOverlay: false }]);
  });

  it("handles games with missing teams", () => {
    expect(applyLiveScores([makeGame({ homeTeam: null })], LIVE, NOW)[0]?.isLiveOverlay).toBe(false);
  });

  it("maps halftime and overtime", () => {
    const half = { "SFO@SEA": { ...LIVE["SFO@SEA"], clock: "0:00", detail: "Halftime" } };
    const overtime = { "SFO@SEA": { ...LIVE["SFO@SEA"], period: 5 } };

    expect(applyLiveScores([makeGame()], half, NOW)[0]?.GameStatus).toBe("Half Time");
    expect(applyLiveScores([makeGame()], overtime, NOW)[0]?.GameStatus).toBe("Overtime");
  });

  it("shows a game ESPN reports over as final while the database catches up", () => {
    const over = { "SFO@SEA": { ...LIVE["SFO@SEA"], detail: "Final", final: true, period: 4 } };
    const [game] = applyLiveScores([makeGame()], over, NOW);

    expect(game?.GameStatus).toBe("Final");
    expect(game?.isLiveOverlay).toBe(true);
  });
});
