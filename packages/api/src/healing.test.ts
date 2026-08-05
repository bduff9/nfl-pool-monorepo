import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockDb: MockDb;

const getGamesForWeek = vi.fn();
const getAllRegisteredUsers = vi.fn();
const getUserPicksForWeek = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("@nfl-pool-monorepo/db/src/queries/game", () => ({ findFutureGame: vi.fn(), getGamesForWeek }));
vi.mock("@nfl-pool-monorepo/db/src/queries/user", () => ({ getAllRegisteredUsers }));
vi.mock("@nfl-pool-monorepo/db/src/queries/pick", () => ({ getUserPicksForWeek }));
vi.mock("@nfl-pool-monorepo/db/src/queries/team", () => ({ getTeamsFromDB: vi.fn() }));
vi.mock("@nfl-pool-monorepo/db/src/mutations/team", () => ({ updateTeamByeWeeks: vi.fn() }));
vi.mock("@nfl-pool-monorepo/transactional/emails/invalidGames", () => ({ sendInvalidGamesEmail: vi.fn() }));

describe("healPicks", () => {
  beforeEach(() => {
    mockDb = createMockDb();
    mockDb.executeTakeFirstOrThrow.mockResolvedValue({ numUpdatedRows: 1n });
    getGamesForWeek.mockReset();
    getAllRegisteredUsers.mockReset();
    getUserPicksForWeek.mockReset();
    vi.resetModules();
  });

  it("makes no updates when every pick is already within range", async () => {
    getGamesForWeek.mockResolvedValueOnce(new Array(3).fill(null));
    getAllRegisteredUsers.mockResolvedValueOnce([{ UserID: 1, UserLeagues: [{ LeagueID: 100 }] }]);
    getUserPicksForWeek.mockResolvedValueOnce([
      { PickID: 1, PickPoints: 1 },
      { PickID: 2, PickPoints: 2 },
      { PickID: 3, PickPoints: 3 },
    ]);

    const { healPicks } = await import("./healing");
    await healPicks(1);

    expect(mockDb.executeTakeFirstOrThrow).not.toHaveBeenCalled();
  });

  it("moves an over-the-max pick down to the next open slot", async () => {
    getGamesForWeek.mockResolvedValueOnce(new Array(2).fill(null));
    getAllRegisteredUsers.mockResolvedValueOnce([{ UserID: 1, UserLeagues: [{ LeagueID: 100 }] }]);
    getUserPicksForWeek.mockResolvedValueOnce([
      { PickID: 1, PickPoints: 1 },
      { PickID: 2, PickPoints: 3 },
    ]);

    const { healPicks } = await import("./healing");
    await healPicks(1);

    expect(mockDb.executeTakeFirstOrThrow).toHaveBeenCalledTimes(1);
    expect(mockDb.where).toHaveBeenCalledWith("PickID", "=", 2);
    expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({ PickPoints: 2 }));
  });

  it("cascades the move down when the target slot is already occupied", async () => {
    getGamesForWeek.mockResolvedValueOnce(new Array(2).fill(null));
    getAllRegisteredUsers.mockResolvedValueOnce([{ UserID: 1, UserLeagues: [{ LeagueID: 100 }] }]);
    getUserPicksForWeek.mockResolvedValueOnce([
      { PickID: 1, PickPoints: 2 },
      { PickID: 2, PickPoints: 3 },
    ]);

    const { healPicks } = await import("./healing");
    await healPicks(1);

    expect(mockDb.executeTakeFirstOrThrow).toHaveBeenCalledTimes(2);
    expect(mockDb.where).toHaveBeenNthCalledWith(1, "PickID", "=", 1);
    expect(mockDb.set).toHaveBeenNthCalledWith(1, expect.objectContaining({ PickPoints: 1 }));
    expect(mockDb.where).toHaveBeenNthCalledWith(2, "PickID", "=", 2);
    expect(mockDb.set).toHaveBeenNthCalledWith(2, expect.objectContaining({ PickPoints: 2 }));
  });

  it("moves a below-the-min pick up to the next open slot", async () => {
    getGamesForWeek.mockResolvedValueOnce(new Array(3).fill(null));
    getAllRegisteredUsers.mockResolvedValueOnce([{ UserID: 1, UserLeagues: [{ LeagueID: 100 }] }]);
    getUserPicksForWeek.mockResolvedValueOnce([
      { PickID: 1, PickPoints: 0 },
      { PickID: 2, PickPoints: 2 },
    ]);

    const { healPicks } = await import("./healing");
    await healPicks(1);

    expect(mockDb.executeTakeFirstOrThrow).toHaveBeenCalledTimes(1);
    expect(mockDb.where).toHaveBeenCalledWith("PickID", "=", 1);
    expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({ PickPoints: 1 }));
  });

  it("ignores null picks and processes every league a user plays in", async () => {
    getGamesForWeek.mockResolvedValueOnce(new Array(2).fill(null));
    getAllRegisteredUsers.mockResolvedValueOnce([
      {
        UserID: 1,
        UserLeagues: [{ LeagueID: 100 }, { LeagueID: 200 }],
      },
    ]);
    getUserPicksForWeek
      .mockResolvedValueOnce([
        { PickID: 1, PickPoints: null },
        { PickID: 2, PickPoints: 1 },
      ])
      .mockResolvedValueOnce([
        { PickID: 3, PickPoints: 1 },
        { PickID: 4, PickPoints: 2 },
      ]);

    const { healPicks } = await import("./healing");
    await healPicks(1);

    expect(getUserPicksForWeek).toHaveBeenCalledWith(100, 1, 1);
    expect(getUserPicksForWeek).toHaveBeenCalledWith(200, 1, 1);
    expect(mockDb.executeTakeFirstOrThrow).not.toHaveBeenCalled();
  });
});
