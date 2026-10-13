import { describe, expect, it } from "vitest";

import { parseEspnSummary } from "./espnSummary";
import fixture from "./espnSummary.fixture.json";

// The fixture is a trimmed capture of ESPN's real summary for the finished BUF at LAR game (OT, 37-34).
describe("parseEspnSummary", () => {
  const summary = parseEspnSummary(fixture);

  it("reads the header with our team codes", () => {
    expect(summary.header).toEqual({
      away: { name: "BUF", score: 37 },
      home: { name: "LAR", score: 34 },
      kickoff: "2026-10-13T00:15Z",
      state: "post",
      statusText: "Final/OT",
    });
  });

  it("lists previous drives newest first with their plays newest first", () => {
    expect(summary.previousDrives).toHaveLength(4);
    expect(summary.previousDrives.map((drive) => drive.id)).toEqual(
      [...fixture.drives.previous].reverse().map((drive) => drive.id),
    );

    const firstDrive = summary.previousDrives.at(-1);

    expect(firstDrive?.plays.map((play) => play.id)).toEqual(
      [...(fixture.drives.previous[0]?.plays ?? [])].reverse().map((play) => play.id),
    );
  });

  it("summarises a drive as team, plays/yards/time and result", () => {
    expect(summary.previousDrives.map((drive) => drive.headline)).toEqual([
      "BUF · 3 plays, 4 yds, 1:32 · Interception",
      "BUF · 10 plays, 55 yds, 5:25 · Field Goal",
      "LAR · 14 plays, 38 yds, 7:48 · Missed FG",
      "BUF · 4 plays, -5 yds, 1:37 · Field Goal",
    ]);
  });

  it("keeps scoring plays newest first and carries the running score", () => {
    expect(summary.scoringPlays.map((play) => play.type)).toEqual(["Touchdown", "Field Goal", "Field Goal"]);
    expect(summary.scoringPlays[0]).toMatchObject({ awayScore: 6, homeScore: 7, team: "LAR" });
  });

  it("converts win probability to home percentages in play order", () => {
    expect(summary.winProbability).toHaveLength(12);
    expect(summary.winProbability[0]).toBeCloseTo(58.01);
    expect(summary.winProbability[1]).toBeCloseTo(48.64);
  });

  it("has no current drive once the game is over", () => {
    expect(summary.currentDrive).toBeUndefined();
  });

  it("reads the current drive while a game is live", () => {
    const [drive, ...rest] = fixture.drives.previous;
    const live = parseEspnSummary({ ...fixture, drives: { current: drive, previous: rest } });

    expect(live.currentDrive?.id).toBe(drive?.id);
    expect(live.previousDrives).toHaveLength(3);
  });

  it("flags scoring plays and labels turnovers", () => {
    const drive = {
      id: "d1",
      plays: [
        { id: "p1", text: "Rush", type: { abbreviation: "RUSH", text: "Rush" } },
        { id: "p2", text: "Intercepted", type: { abbreviation: "INTR", text: "Pass Interception Return" } },
        { id: "p3", scoringPlay: true, text: "TD", type: { abbreviation: "TD", text: "Rushing Touchdown" } },
      ],
    };
    const [parsed] = parseEspnSummary({ drives: { previous: [drive] } }).previousDrives;

    expect(parsed?.plays.map((play) => [play.label, play.isTurnover, play.isScoring])).toEqual([
      ["TOUCHDOWN", false, true],
      ["INTERCEPTION", true, false],
      [undefined, false, false],
    ]);
  });

  it("drops malformed drives, plays and sections without throwing", () => {
    const parsed = parseEspnSummary({
      drives: { previous: [{ nope: true }, { id: "d1", plays: [{ id: 5 }, { id: "p1", text: "Rush" }] }] },
      header: { competitions: "nope" },
      scoringPlays: [42],
      winprobability: [{ homeWinPercentage: "x" }, { homeWinPercentage: 0.5 }],
    });

    expect(parsed.header).toBeUndefined();
    expect(parsed.previousDrives).toHaveLength(1);
    expect(parsed.previousDrives[0]?.plays).toHaveLength(1);
    expect(parsed.scoringPlays).toEqual([]);
    expect(parsed.winProbability).toEqual([50]);
  });

  it("returns an empty summary for payloads that are not objects", () => {
    expect(parseEspnSummary(null)).toEqual({ previousDrives: [], scoringPlays: [], winProbability: [] });
    expect(parseEspnSummary("nope").header).toBeUndefined();
  });
});
