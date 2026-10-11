import { describe, expect, it } from "vitest";

import { getAvailablePoints, getDroppedTeam, placePoints, type WeeklyPicks } from "./pickPlacement";

const HOME = { TeamID: 1, TeamName: "Home" };
const VISITOR = { TeamID: 2, TeamName: "Visitor" };
const NOW = new Date("2026-10-11T12:00:00Z");
const LATER = new Date("2026-10-11T18:00:00Z");
const EARLIER = new Date("2026-10-11T08:00:00Z");

const makePick = (overrides: Partial<WeeklyPicks[number]> = {}) =>
  ({
    GameID: 1,
    GameKickoff: LATER,
    homeTeam: HOME,
    PickPoints: null,
    pickTeam: null,
    TeamID: null,
    visitorTeam: VISITOR,
    ...overrides,
  }) as unknown as WeeklyPicks[number];

describe("getDroppedTeam", () => {
  it("is the home or visitor team for a drop on that side of the game", () => {
    expect(getDroppedTeam(makePick(), { gameID: 1, type: "home" })).toBe(HOME);
    expect(getDroppedTeam(makePick(), { gameID: 1, type: "visitor" })).toBe(VISITOR);
  });

  it("is null for a drop on the bank, on nothing, or on an unknown game", () => {
    expect(getDroppedTeam(makePick(), { gameID: null, type: "pointBank" })).toBeNull();
    expect(getDroppedTeam(makePick(), null)).toBeNull();
    expect(getDroppedTeam(undefined, { gameID: 1, type: "home" })).toBeNull();
  });
});

describe("placePoints", () => {
  it("puts the points and team on the dropped game", () => {
    const [pick] = placePoints([makePick()], 1, 5, HOME as never, NOW);

    expect(pick).toMatchObject({ PickPoints: 5, pickTeam: HOME, TeamID: 1 });
  });

  it("frees the points from the game that held them", () => {
    const picks = [makePick({ GameID: 1, PickPoints: 5, pickTeam: HOME as never }), makePick({ GameID: 2 })];
    const result = placePoints(picks, 2, 5, VISITOR as never, NOW);

    expect(result[0]).toMatchObject({ PickPoints: null, pickTeam: null, TeamID: null });
    expect(result[1]).toMatchObject({ PickPoints: 5, TeamID: 2 });
  });

  it("clears the points when they are dropped back on the bank", () => {
    const picks = [makePick({ PickPoints: 5, pickTeam: HOME as never })];

    expect(placePoints(picks, null, 5, null, NOW)[0]).toMatchObject({ PickPoints: null, pickTeam: null });
  });

  it("never changes a game that has already started", () => {
    const started = makePick({ GameKickoff: EARLIER, PickPoints: 5, pickTeam: HOME as never });

    expect(placePoints([started], 1, 7, VISITOR as never, NOW)[0]).toBe(started);
  });
});

describe("getAvailablePoints", () => {
  it("lists every point when none are placed", () => {
    expect(getAvailablePoints([makePick({ GameID: 1 }), makePick({ GameID: 2 })], NOW)).toEqual([1, 2]);
  });

  it("leaves out points placed on a game with a team", () => {
    const picks = [makePick({ PickPoints: 2, pickTeam: HOME as never }), makePick({ GameID: 2 })];

    expect(getAvailablePoints(picks, NOW)).toEqual([1]);
  });

  it("keeps a started game's points used even without a team", () => {
    const picks = [makePick({ GameKickoff: EARLIER, PickPoints: 1 }), makePick({ GameID: 2 })];

    expect(getAvailablePoints(picks, NOW)).toEqual([2]);
  });

  it("keeps points on an unstarted game that has no team available", () => {
    const picks = [makePick({ PickPoints: 1 }), makePick({ GameID: 2 })];

    expect(getAvailablePoints(picks, NOW)).toEqual([1, 2]);
  });
});
