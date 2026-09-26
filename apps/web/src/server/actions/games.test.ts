import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockDb: MockDb;

const getCurrentSession = vi.fn();
const manuallyUpdateGame = vi.fn();
const updateOverallMV = vi.fn();
const updateSurvivorMV = vi.fn();
const updateWeeklyMV = vi.fn();
const revalidatePath = vi.fn();
const updateTag = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("@/server/loaders/sessions", () => ({ getCurrentSession }));
vi.mock("@nfl-pool-monorepo/db/src/mutations/game", () => ({ manuallyUpdateGame }));
vi.mock("@nfl-pool-monorepo/db/src/mutations/overallMv", () => ({ updateOverallMV }));
vi.mock("@nfl-pool-monorepo/db/src/mutations/survivorMv", () => ({ updateSurvivorMV }));
vi.mock("@nfl-pool-monorepo/db/src/mutations/weeklyMv", () => ({ updateWeeklyMV }));
vi.mock("next/cache", () => ({ revalidatePath, updateTag }));

const AUTHED_USER = {
  doneRegistering: 1,
  email: "user@example.com",
  id: 1,
  image: null,
  isAdmin: 0,
  name: "Test User",
  playsSurvivor: 0,
};

const ADMIN_USER = { ...AUTHED_USER, isAdmin: 1 };

const VALID_INPUT = {
  gameID: 12,
  homeScore: 27,
  status: "Final" as const,
  visitorScore: 24,
};

const resetAllMocks = () => {
  mockDb = createMockDb();
  getCurrentSession.mockReset().mockResolvedValue({ session: { id: "s1" }, user: ADMIN_USER });
  manuallyUpdateGame.mockReset().mockResolvedValue(undefined);
  updateOverallMV.mockReset().mockResolvedValue(undefined);
  updateSurvivorMV.mockReset().mockResolvedValue(undefined);
  updateWeeklyMV.mockReset().mockResolvedValue(undefined);
  revalidatePath.mockReset();
  updateTag.mockReset();
  vi.resetModules();
};

describe("adminUpdateGame", () => {
  beforeEach(resetAllMocks);

  it("applies the override and refreshes the MVs, paths, and cache tags", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce({ GameWeek: 3 });

    const { adminUpdateGame } = await import("./games");
    const result = await adminUpdateGame(VALID_INPUT);

    expect(result?.serverError).toBeUndefined();
    expect(result?.data?.status).toBe("Success");
    expect(manuallyUpdateGame).toHaveBeenCalledWith({
      gameID: 12,
      homeScore: 27,
      status: "Final",
      updatedBy: "user@example.com",
      visitorScore: 24,
    });
    expect(updateWeeklyMV).toHaveBeenCalledWith(3);
    expect(updateOverallMV).toHaveBeenCalledWith(3);
    expect(updateSurvivorMV).toHaveBeenCalledWith(3);
    expect(revalidatePath).toHaveBeenCalledWith("/admin/games");
    expect(revalidatePath).toHaveBeenCalledWith("/scoreboard");
    expect(revalidatePath).toHaveBeenCalledWith("/picks/view");
    expect(updateTag).toHaveBeenCalledWith("games-week-3");
    expect(updateTag).toHaveBeenCalledWith("overall-mv");
    expect(updateTag).toHaveBeenCalledWith("weekly-mv-3");
  });

  it("rejects non-admin users", async () => {
    getCurrentSession.mockResolvedValue({ session: { id: "s1" }, user: AUTHED_USER });

    const { adminUpdateGame } = await import("./games");
    const result = await adminUpdateGame(VALID_INPUT);

    expect(result?.serverError).toBe("Unauthorized");
    expect(manuallyUpdateGame).not.toHaveBeenCalled();
  });

  it("fails when the game is not found", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

    const { adminUpdateGame } = await import("./games");
    const result = await adminUpdateGame(VALID_INPUT);

    expect(result?.serverError).toBe("Game not found");
    expect(manuallyUpdateGame).not.toHaveBeenCalled();
    expect(updateWeeklyMV).not.toHaveBeenCalled();
  });

  it("fails without touching the MVs when the override write fails", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce({ GameWeek: 3 });
    manuallyUpdateGame.mockRejectedValueOnce(new Error("db down"));

    const { adminUpdateGame } = await import("./games");
    const result = await adminUpdateGame(VALID_INPUT);

    expect(result?.serverError).toBe("Failed to update game");
    expect(updateWeeklyMV).not.toHaveBeenCalled();
    expect(updateOverallMV).not.toHaveBeenCalled();
    expect(updateSurvivorMV).not.toHaveBeenCalled();
  });

  it("still succeeds when an MV refresh fails, leaving convergence to cron", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce({ GameWeek: 3 });
    updateWeeklyMV.mockRejectedValueOnce(new Error("mv sql blew up"));

    const { adminUpdateGame } = await import("./games");
    const result = await adminUpdateGame(VALID_INPUT);

    expect(result?.serverError).toBeUndefined();
    expect(result?.data?.status).toBe("Success");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/games");
    expect(updateTag).toHaveBeenCalledWith("games-week-3");
  });
});
