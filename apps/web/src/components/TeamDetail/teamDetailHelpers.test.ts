import { describe, expect, it } from "vitest";

import { getHistoryEntry, getRecordLabel, getTeamFields, type HistoryGame } from "./teamDetailHelpers";

const makeGame = (overrides: Partial<HistoryGame>): HistoryGame =>
  ({
    GameHomeScore: 24,
    GameVisitorScore: 17,
    GameWeek: 3,
    HomeTeamID: 1,
    homeTeamShortName: "HOM",
    VisitorTeamID: 2,
    visitorTeamShortName: "VIS",
    WinnerTeamID: 1,
    ...overrides,
  }) as HistoryGame;

describe("getRecordLabel", () => {
  it("formats wins-losses-ties", () => {
    expect(getRecordLabel({ losses: 2, ties: 1, wins: 3 })).toBe("3-2-1");
  });

  it("defaults missing records and null fields to zero", () => {
    expect(getRecordLabel(undefined)).toBe("0-0-0");
    expect(getRecordLabel(null)).toBe("0-0-0");
    expect(getRecordLabel({ losses: null, ties: null, wins: 4 })).toBe("4-0-0");
  });
});

describe("getTeamFields", () => {
  it("returns an empty object for a missing team", () => {
    expect(getTeamFields(null)).toEqual({});
  });
});

describe("getHistoryEntry", () => {
  it("reports a home win", () => {
    expect(getHistoryEntry(makeGame({}), 1)).toEqual({
      opponentScore: 17,
      opponentShortName: "VIS",
      ownScore: 24,
      prefix: "vs",
      resultClassName: "text-green-500",
      resultText: "W",
    });
  });

  it("reports an away loss", () => {
    expect(getHistoryEntry(makeGame({}), 2)).toEqual({
      opponentScore: 24,
      opponentShortName: "HOM",
      ownScore: 17,
      prefix: "@",
      resultClassName: "text-red-600",
      resultText: "L",
    });
  });

  it("reports a tie when neither team won", () => {
    const entry = getHistoryEntry(makeGame({ WinnerTeamID: null as never }), 1);

    expect(entry.resultText).toBe("T");
    expect(entry.resultClassName).toBe("");
  });
});
