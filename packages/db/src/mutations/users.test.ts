import { DEFAULT_AUTO_PICKS } from "@nfl-pool-monorepo/utils/constants";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockDb, type MockDb } from "../test-utils/mockDb";

let mockDb: MockDb;

const getSystemYear = vi.fn();

vi.mock("../kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("../queries/league", () => ({ getPublicLeague: vi.fn() }));
vi.mock("../queries/systemValue", () => ({ getSurvivorCost: vi.fn(), getSystemYear }));
vi.mock("../queries/week", () => ({ getCurrentWeek: vi.fn() }));

describe("removeUserFromSeason", () => {
  beforeEach(() => {
    mockDb = createMockDb();
    mockDb.execute.mockResolvedValue([]);
    mockDb.executeTakeFirstOrThrow.mockResolvedValue({});
    getSystemYear.mockReset().mockResolvedValue(2026);
    vi.resetModules();
  });

  it("deletes the season entries, standings rows, fees, and history, then resets the user", async () => {
    const { removeUserFromSeason } = await import("./users");

    await removeUserFromSeason(mockDb as never, 7, "admin@example.com");

    expect(mockDb.deleteFrom.mock.calls.map(([table]) => table)).toEqual([
      "Picks",
      "Tiebreakers",
      "SurvivorPicks",
      "WeeklyMV",
      "OverallMV",
      "SurvivorMV",
      "Payments",
      "UserHistory",
    ]);
    expect(mockDb.where).toHaveBeenCalledWith("UserID", "=", 7);
    expect(mockDb.where).toHaveBeenCalledWith("PaymentType", "=", "Fee");
    expect(mockDb.where).toHaveBeenCalledWith("UserHistoryYear", "=", 2026);
    expect(mockDb.updateTable).toHaveBeenCalledWith("Users");
    expect(mockDb.set).toHaveBeenCalledWith(
      expect.objectContaining({
        UserAutoPicksLeft: DEFAULT_AUTO_PICKS,
        UserDoneRegistering: 0,
        UserPlaysSurvivor: 0,
        UserUpdatedBy: "admin@example.com",
      }),
    );
  });
});
