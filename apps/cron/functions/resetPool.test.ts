import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockDb: MockDb;

const getEntireSeasonFromApi = vi.fn();
const verifySeasonYearForReset = vi.fn();
const populateGames = vi.fn();
const populateWinnerHistory = vi.fn();
const clearOldUserData = vi.fn();
const sqlExecute = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("@nfl-pool-monorepo/api/src", () => ({ getEntireSeasonFromApi }));
vi.mock("@nfl-pool-monorepo/db/src/queries/systemValue", () => ({ verifySeasonYearForReset }));
vi.mock("@nfl-pool-monorepo/db/src/mutations/game", () => ({ populateGames }));
vi.mock("@nfl-pool-monorepo/db/src/mutations/history", () => ({ populateWinnerHistory }));
vi.mock("@nfl-pool-monorepo/db/src/mutations/users", () => ({ clearOldUserData }));
vi.mock("kysely", async (importOriginal) => {
  const actual = await importOriginal<typeof import("kysely")>();

  return { ...actual, sql: () => ({ execute: sqlExecute }) };
});

const resetAllMocks = () => {
  mockDb = createMockDb();
  getEntireSeasonFromApi.mockReset().mockResolvedValue([{ week: 1 }]);
  verifySeasonYearForReset.mockReset().mockResolvedValue(2026);
  populateGames.mockReset().mockResolvedValue(undefined);
  populateWinnerHistory.mockReset().mockResolvedValue(undefined);
  clearOldUserData.mockReset().mockResolvedValue(undefined);
  sqlExecute.mockReset().mockResolvedValue(undefined);
  mockDb.executeTakeFirstOrThrow.mockResolvedValue({});
  vi.resetModules();
};

describe("resetPool handler", () => {
  beforeEach(resetAllMocks);

  it("does nothing when the pool isn't ready for a season reset", async () => {
    verifySeasonYearForReset.mockResolvedValue(null);

    const { handler } = await import("./resetPool");
    await handler(null as never, null as never, null as never);

    expect(getEntireSeasonFromApi).not.toHaveBeenCalled();
    expect(populateGames).not.toHaveBeenCalled();
  });

  it("does nothing when the API has no data for the new season", async () => {
    getEntireSeasonFromApi.mockResolvedValue([]);

    const { handler } = await import("./resetPool");
    await handler(null as never, null as never, null as never);

    expect(populateGames).not.toHaveBeenCalled();
  });

  it("clears old season data and populates the new season on success", async () => {
    const { handler } = await import("./resetPool");
    await handler(null as never, null as never, null as never);

    expect(populateWinnerHistory).toHaveBeenCalledWith(mockDb);
    expect(clearOldUserData).toHaveBeenCalledWith(mockDb);
    expect(populateGames).toHaveBeenCalledWith(mockDb, [{ week: 1 }]);
  });

  it("catches and logs an error instead of throwing when the reset transaction fails", async () => {
    mockDb.executeTakeFirstOrThrow.mockRejectedValueOnce(new Error("deadlock"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { handler } = await import("./resetPool");
    await expect(handler(null as never, null as never, null as never)).resolves.toBeUndefined();

    expect(consoleError).toHaveBeenCalledWith("Error resetting pool:", expect.any(Error));
    consoleError.mockRestore();
  });
});
