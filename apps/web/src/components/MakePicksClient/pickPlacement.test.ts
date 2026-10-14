import { describe, expect, it } from "vitest";

import {
  clearUnstartedPicks,
  getAvailablePoints,
  getLastGameMatchup,
  getTiebreakerPlaceholder,
  isDropMove,
  placePoints,
  resolveDrop,
  type WeeklyPicks,
} from "./pickPlacement";

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

describe("clearUnstartedPicks", () => {
  it("clears games that have not kicked off and keeps started ones", () => {
    const picks = [
      makePick({ GameID: 1, PickPoints: 2, pickTeam: HOME as never, TeamID: 1 }),
      makePick({ GameID: 2, GameKickoff: EARLIER, PickPoints: 1, pickTeam: VISITOR as never, TeamID: 2 }),
    ];

    const [future, started] = clearUnstartedPicks(picks, NOW);

    expect(future).toMatchObject({ PickPoints: null, pickTeam: null, TeamID: null });
    expect(started).toBe(picks[1]);
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

describe("isDropMove", () => {
  it("is false without a destination or when dropped where it started", () => {
    expect(isDropMove({ droppableId: "pointBank" }, null)).toBe(false);
    expect(isDropMove({ droppableId: "pointBank" }, undefined)).toBe(false);
    expect(isDropMove({ droppableId: "pointBank" }, { droppableId: "pointBank" })).toBe(false);
  });

  it("is true when dropped somewhere else", () => {
    expect(isDropMove({ droppableId: "pointBank" }, { droppableId: "home-pick-for-game-1" })).toBe(true);
  });
});

describe("resolveDrop", () => {
  const picks = [
    makePick({ GameID: 1 }),
    makePick({ GameID: 2, homeTeam: VISITOR as never, visitorTeam: HOME as never }),
  ];

  it("resolves the points, game and team of a drop on a side of a game", () => {
    expect(resolveDrop(picks, "point-5", "pointBank", "home-pick-for-game-1")).toEqual({
      gameID: 1,
      pickTeam: HOME,
      points: 5,
      teamID: 1,
    });
    expect(resolveDrop(picks, "point-5", "pointBank", "visitor-pick-for-game-2")).toEqual({
      gameID: 2,
      pickTeam: HOME,
      points: 5,
      teamID: 1,
    });
  });

  it("resolves no game or team for a drop back on the bank", () => {
    expect(resolveDrop(picks, "point-3", "home-pick-for-game-1", "pointBank")).toEqual({
      gameID: null,
      pickTeam: null,
      points: 3,
      teamID: null,
    });
  });

  it("resolves no team for a drop on an unknown game", () => {
    expect(resolveDrop(picks, "point-3", "pointBank", "home-pick-for-game-99")).toMatchObject({
      gameID: 99,
      pickTeam: null,
      teamID: null,
    });
  });
});

describe("tiebreaker text", () => {
  it("names the last game's matchup", () => {
    expect(getLastGameMatchup(makePick())).toBe("Visitor @ Home");
    expect(getLastGameMatchup(undefined)).toBeNull();
  });

  it("mentions the matchup in the placeholder only when there is one", () => {
    expect(getTiebreakerPlaceholder("Visitor @ Home")).toBe("Guess the total final score of the Visitor @ Home game");
    expect(getTiebreakerPlaceholder(null)).toBe("Guess the total final score");
  });
});
