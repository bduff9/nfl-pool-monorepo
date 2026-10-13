import { describe, expect, it } from "vitest";

import { getPlayLabel, normalizePercent, parseSituationCore, parseSituationDetail } from "./espnSituation";

// Shape taken from a real ESPN live event (BUF at LAR), plus a lastPlay in the shape ESPN uses in its summary plays.
const REAL_SITUATION = {
  awayTimeouts: 3,
  distance: 4,
  down: 1,
  downDistanceText: "1st & Goal at BUF 4",
  homeTimeouts: 3,
  isRedZone: true,
  lastPlay: {
    drive: { description: "6 plays, 62 yards, 3:10" },
    id: "401872994901",
    probability: { awayWinPercentage: 0.36, homeWinPercentage: 0.64, tiePercentage: 0 },
    scoreValue: 0,
    text: "M.Stafford pass short right to T.Higbee to BUF 4 for 12 yards.",
    type: { abbreviation: "REC", text: "Pass Reception" },
  },
  possession: "14",
  possessionText: "BUF 4",
  shortDownDistanceText: "1st & Goal",
  yardLine: 96,
};

describe("parseSituationDetail", () => {
  it("reads down and distance, ball spot, timeouts, drive, win probability and the last play", () => {
    expect(parseSituationDetail(REAL_SITUATION)).toEqual({
      awayTimeouts: 3,
      ballSpot: "BUF 4",
      downDistance: "1st & Goal",
      drive: "6 plays, 62 yards, 3:10",
      homeTimeouts: 3,
      homeWinPct: 64,
      lastPlay: {
        id: "401872994901",
        isScoring: false,
        isTurnover: false,
        label: undefined,
        text: "M.Stafford pass short right to T.Higbee to BUF 4 for 12 yards.",
      },
    });
  });

  it("keeps whatever is present when fields are missing", () => {
    expect(parseSituationDetail({ shortDownDistanceText: "3rd & 7" })).toEqual({ downDistance: "3rd & 7" });
  });

  it("is undefined when there is nothing usable", () => {
    expect(parseSituationDetail(undefined)).toBeUndefined();
    expect(parseSituationDetail({})).toBeUndefined();
    expect(parseSituationDetail("nope")).toBeUndefined();
  });

  it("drops a block of the wrong shape without discarding the rest", () => {
    const detail = parseSituationDetail({ ...REAL_SITUATION, lastPlay: { text: 42 } });

    expect(detail).toMatchObject({ ballSpot: "BUF 4", downDistance: "1st & Goal" });
    expect(detail?.lastPlay).toBeUndefined();
  });

  it("drops the whole detail when ESPN changes the type of a detail field", () => {
    expect(parseSituationDetail({ homeTimeouts: "3", shortDownDistanceText: "1st & 10" })).toBeUndefined();
  });

  it("flags scoring plays and labels them", () => {
    const detail = parseSituationDetail({
      lastPlay: {
        id: "1",
        scoreValue: 6,
        text: "T.Higbee 4 Yd pass",
        type: { abbreviation: "TD", text: "Passing Touchdown" },
      },
    });

    expect(detail?.lastPlay).toMatchObject({ isScoring: true, isTurnover: false, label: "TOUCHDOWN" });
  });

  it("ignores a last play without text", () => {
    expect(parseSituationDetail({ lastPlay: { id: "1" } })).toBeUndefined();
  });
});

describe("parseSituationCore", () => {
  it("reads possession and the red zone flag", () => {
    expect(parseSituationCore(REAL_SITUATION)).toEqual({ isRedZone: true, possession: "14" });
  });

  it("defaults when the situation is absent or malformed", () => {
    expect(parseSituationCore(undefined)).toEqual({ isRedZone: false });
    expect(parseSituationCore({ isRedZone: "yes" })).toEqual({ isRedZone: false });
  });
});

describe("getPlayLabel", () => {
  it.each([
    ["Passing Touchdown", "TD", "TOUCHDOWN", false],
    ["Rushing Touchdown", "TD", "TOUCHDOWN", false],
    ["Field Goal Good", "FG", "FIELD GOAL", false],
    ["Field Goal Missed", "FGM", "MISSED FIELD GOAL", false],
    ["Blocked Field Goal", "BFG", "MISSED FIELD GOAL", false],
    ["Pass Interception Return", "INTR", "INTERCEPTION", true],
    ["Fumble Recovery (Opponent)", undefined, "FUMBLE", true],
    ["Fumble Recovery (Own)", undefined, "FUMBLE", false],
    ["Safety", undefined, "SAFETY", false],
  ])("labels %s", (typeText, abbreviation, label, isTurnover) => {
    expect(getPlayLabel(typeText, abbreviation)).toEqual({ isTurnover, label });
  });

  it("has no label for ordinary plays", () => {
    expect(getPlayLabel("Rush", "RUSH")).toBeUndefined();
    expect(getPlayLabel("Punt", "PUNT")).toBeUndefined();
    expect(getPlayLabel(undefined, undefined)).toBeUndefined();
  });
});

describe("normalizePercent", () => {
  it("turns ESPN fractions into percentages and leaves percentages alone", () => {
    expect(normalizePercent(0.5801)).toBeCloseTo(58.01);
    expect(normalizePercent(64)).toBe(64);
  });
});
