import type { getDbGameFromApi } from "@nfl-pool-monorepo/api/src/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockDb, type MockDb } from "../test-utils/mockDb";

let mockDb: MockDb;

vi.mock("../kysely", () => ({
  get db() {
    return mockDb;
  },
}));

const makeGame = (overrides: Partial<Awaited<ReturnType<typeof getDbGameFromApi>>> = {}) =>
  ({
    GameHomeScore: 0,
    GameID: 101,
    GameNumber: 1,
    GameStatus: "Final",
    GameTimeLeftInSeconds: 0,
    GameVisitorScore: 0,
    GameWeek: 1,
    HomeTeamID: 1,
    VisitorTeamID: 2,
    ...overrides,
  }) as Awaited<ReturnType<typeof getDbGameFromApi>>;

describe("updateMissedPicks", () => {
  beforeEach(() => {
    mockDb = createMockDb();
    vi.resetModules();
  });

  it("does nothing when there are no missed picks", async () => {
    mockDb.execute.mockResolvedValueOnce([]);

    const { updateMissedPicks } = await import("./pick");
    await updateMissedPicks(makeGame());

    expect(mockDb.executeTakeFirstOrThrow).not.toHaveBeenCalled();
  });

  it("skips a missed pick that already has PickPoints set", async () => {
    mockDb.execute.mockResolvedValueOnce([
      {
        HomeTeamID: 1,
        PickID: 1,
        PickPoints: 5,
        UserAutoPickStrategy: null,
        UserAutoPicksLeft: 0,
        UserID: 10,
        VisitorTeamID: 2,
      },
    ]);

    const { updateMissedPicks } = await import("./pick");
    await updateMissedPicks(makeGame());

    expect(mockDb.executeTakeFirstOrThrow).not.toHaveBeenCalled();
  });

  it("assigns the lowest unused point when the user has no auto-pick strategy", async () => {
    mockDb.execute
      .mockResolvedValueOnce([
        {
          HomeTeamID: 1,
          PickID: 1,
          PickPoints: null,
          UserAutoPickStrategy: null,
          UserAutoPicksLeft: 0,
          UserID: 10,
          VisitorTeamID: 2,
        },
      ])
      .mockResolvedValueOnce([{ points: 2 }, { points: 3 }]);
    mockDb.executeTakeFirstOrThrow.mockResolvedValue({ numUpdatedRows: 1n });

    const { updateMissedPicks } = await import("./pick");
    await updateMissedPicks(makeGame());

    expect(mockDb.executeTakeFirstOrThrow).toHaveBeenCalledTimes(1);
    expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({ PickPoints: 1 }));
  });

  it("throws when the user has missed a pick but has no points left to use", async () => {
    mockDb.execute
      .mockResolvedValueOnce([
        {
          HomeTeamID: 1,
          PickID: 1,
          PickPoints: null,
          UserAutoPickStrategy: null,
          UserAutoPicksLeft: 0,
          UserID: 10,
          VisitorTeamID: 2,
        },
      ])
      .mockResolvedValueOnce([{ points: 1 }]);

    const { updateMissedPicks } = await import("./pick");

    await expect(updateMissedPicks(makeGame())).rejects.toThrow("User missed pick but has no picks remaining");
    expect(mockDb.executeTakeFirstOrThrow).not.toHaveBeenCalled();
  });

  it("auto-picks the home team when strategy is Home and picks remain", async () => {
    mockDb.execute
      .mockResolvedValueOnce([
        {
          HomeTeamID: 1,
          PickID: 1,
          PickPoints: null,
          UserAutoPickStrategy: "Home",
          UserAutoPicksLeft: 3,
          UserID: 10,
          VisitorTeamID: 2,
        },
      ])
      .mockResolvedValueOnce([{ points: null }]);
    mockDb.executeTakeFirstOrThrow.mockResolvedValue({ numUpdatedRows: 1n });

    const { updateMissedPicks } = await import("./pick");
    await updateMissedPicks(makeGame());

    expect(mockDb.executeTakeFirstOrThrow).toHaveBeenCalledTimes(3);
    expect(mockDb.updateTable).toHaveBeenNthCalledWith(2, "Users");
    expect(mockDb.set).toHaveBeenNthCalledWith(2, expect.objectContaining({ UserAutoPicksLeft: 2 }));
    expect(mockDb.updateTable).toHaveBeenNthCalledWith(3, "Picks");
    expect(mockDb.set).toHaveBeenNthCalledWith(3, expect.objectContaining({ TeamID: 1 }));
  });

  it("auto-picks the visitor team when strategy is Away and picks remain", async () => {
    mockDb.execute
      .mockResolvedValueOnce([
        {
          HomeTeamID: 1,
          PickID: 1,
          PickPoints: null,
          UserAutoPickStrategy: "Away",
          UserAutoPicksLeft: 1,
          UserID: 10,
          VisitorTeamID: 2,
        },
      ])
      .mockResolvedValueOnce([{ points: null }]);
    mockDb.executeTakeFirstOrThrow.mockResolvedValue({ numUpdatedRows: 1n });

    const { updateMissedPicks } = await import("./pick");
    await updateMissedPicks(makeGame());

    expect(mockDb.set).toHaveBeenNthCalledWith(3, expect.objectContaining({ TeamID: 2 }));
  });

  it("does not auto-pick when the user has no auto-picks remaining", async () => {
    mockDb.execute
      .mockResolvedValueOnce([
        {
          HomeTeamID: 1,
          PickID: 1,
          PickPoints: null,
          UserAutoPickStrategy: "Home",
          UserAutoPicksLeft: 0,
          UserID: 10,
          VisitorTeamID: 2,
        },
      ])
      .mockResolvedValueOnce([{ points: null }]);
    mockDb.executeTakeFirstOrThrow.mockResolvedValue({ numUpdatedRows: 1n });

    const { updateMissedPicks } = await import("./pick");
    await updateMissedPicks(makeGame());

    expect(mockDb.executeTakeFirstOrThrow).toHaveBeenCalledTimes(1);
    expect(mockDb.updateTable).not.toHaveBeenCalledWith("Users");
  });
});
