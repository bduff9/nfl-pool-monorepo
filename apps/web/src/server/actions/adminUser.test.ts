import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockDb: MockDb;

const getCurrentSession = vi.fn();
const deregisterUserMutation = vi.fn();
const updateOverallMV = vi.fn();
const updateSurvivorMV = vi.fn();
const updateWeeklyMV = vi.fn();
const updateAllPayouts = vi.fn();
const getCurrentWeek = vi.fn();
const revalidatePath = vi.fn();
const updateTag = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("@/server/loaders/sessions", () => ({ getCurrentSession }));
vi.mock("@nfl-pool-monorepo/db/src/mutations/users", () => ({ removeUserFromSeason: deregisterUserMutation }));
vi.mock("@nfl-pool-monorepo/db/src/mutations/overallMv", () => ({ updateOverallMV }));
vi.mock("@nfl-pool-monorepo/db/src/mutations/survivorMv", () => ({ updateSurvivorMV }));
vi.mock("@nfl-pool-monorepo/db/src/mutations/weeklyMv", () => ({ updateWeeklyMV }));
vi.mock("@nfl-pool-monorepo/db/src/mutations/payment", () => ({ updateAllPayouts }));
vi.mock("@nfl-pool-monorepo/db/src/queries/week", () => ({ getCurrentWeek }));
vi.mock("next/cache", () => ({ revalidatePath, updateTag }));

const ADMIN_USER = {
  doneRegistering: 1,
  email: "admin@example.com",
  id: 1,
  image: null,
  isAdmin: 1,
  name: "Admin User",
  playsSurvivor: 0,
};

const resetAllMocks = () => {
  mockDb = createMockDb();
  getCurrentSession.mockReset().mockResolvedValue({ session: { id: "s1" }, user: ADMIN_USER });
  deregisterUserMutation.mockReset().mockResolvedValue(undefined);
  updateOverallMV.mockReset().mockResolvedValue(undefined);
  updateSurvivorMV.mockReset().mockResolvedValue(undefined);
  updateWeeklyMV.mockReset().mockResolvedValue(undefined);
  updateAllPayouts.mockReset().mockResolvedValue(undefined);
  getCurrentWeek.mockReset().mockResolvedValue(2);
  revalidatePath.mockReset();
  updateTag.mockReset();
  vi.resetModules();
};

describe("deregisterUser", () => {
  beforeEach(resetAllMocks);

  it("refuses to deregister the acting admin", async () => {
    const { deregisterUser } = await import("./adminUser");
    const result = await deregisterUser({ userID: 1 });

    expect(result?.serverError).toContain("yourself");
    expect(deregisterUserMutation).not.toHaveBeenCalled();
  });

  it("refuses users with no entries this season", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce({ hasEntries: 0, UserName: "Pat" });

    const { deregisterUser } = await import("./adminUser");
    const result = await deregisterUser({ userID: 5 });

    expect(result?.serverError).toContain("no entries");
    expect(deregisterUserMutation).not.toHaveBeenCalled();
  });

  it("refuses users who have a payment on record", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce({ hasEntries: 1, UserName: "Pat" });
    mockDb.execute.mockResolvedValueOnce([{ PaymentType: "Fee" }, { PaymentType: "Paid" }]);

    const { deregisterUser } = await import("./adminUser");
    const result = await deregisterUser({ userID: 5 });

    expect(result?.serverError).toContain("payment on record");
    expect(deregisterUserMutation).not.toHaveBeenCalled();
    expect(updateWeeklyMV).not.toHaveBeenCalled();
  });

  it("deregisters, rebuilds standings for every started week, and expires caches", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce({ hasEntries: 1, UserName: "Pat" });
    mockDb.execute.mockResolvedValueOnce([{ PaymentType: "Fee" }]);
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({});

    const { deregisterUser } = await import("./adminUser");
    const result = await deregisterUser({ userID: 5 });

    expect(result?.serverError).toBeUndefined();
    expect(result?.data?.status).toBe("Success");
    expect(deregisterUserMutation).toHaveBeenCalledWith(mockDb, 5, "admin@example.com");
    expect(mockDb.values).toHaveBeenCalledWith(expect.objectContaining({ LogAction: "REGISTER", UserID: 5 }));
    expect(updateWeeklyMV).toHaveBeenCalledTimes(2);
    expect(updateWeeklyMV).toHaveBeenCalledWith(1);
    expect(updateWeeklyMV).toHaveBeenCalledWith(2);
    expect(updateOverallMV).toHaveBeenCalledWith(2);
    expect(updateSurvivorMV).toHaveBeenCalledWith(2);
    expect(updateAllPayouts).toHaveBeenCalledWith(2);
    expect(updateTag).toHaveBeenCalledWith("weekly-mv-1");
    expect(updateTag).toHaveBeenCalledWith("weekly-mv-2");
    expect(updateTag).toHaveBeenCalledWith("overall-mv");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/users");
  });

  it("still succeeds and expires caches when the standings rebuild fails", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce({ hasEntries: 1, UserName: "Pat" });
    mockDb.execute.mockResolvedValueOnce([]);
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({});
    updateWeeklyMV.mockRejectedValueOnce(new Error("lock timeout"));

    const { deregisterUser } = await import("./adminUser");
    const result = await deregisterUser({ userID: 5 });

    expect(result?.data?.status).toBe("Success");
    expect(updateTag).toHaveBeenCalledWith("overall-mv");
  });
});
