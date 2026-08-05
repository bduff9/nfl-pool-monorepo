import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockDb: MockDb;

const getCurrentSession = vi.fn();
const revalidatePath = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("@/server/loaders/sessions", () => ({ getCurrentSession }));
vi.mock("next/cache", () => ({ revalidatePath }));

const AUTHED_USER = {
  doneRegistering: 1,
  email: "user@example.com",
  id: 1,
  image: null,
  isAdmin: 0,
  name: "Test User",
  playsSurvivor: 0,
};

const PAST = new Date(Date.now() - 60 * 60 * 1000);
const FUTURE = new Date(Date.now() + 60 * 60 * 1000);

describe("updateMyTiebreakerScore", () => {
  beforeEach(() => {
    mockDb = createMockDb();
    getCurrentSession.mockReset().mockResolvedValue({ session: { id: "s1" }, user: AUTHED_USER });
    revalidatePath.mockReset();
    vi.resetModules();
  });

  it("throws when the last game of the week has already started", async () => {
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ GameKickoff: PAST });

    const { updateMyTiebreakerScore } = await import("./tiebreaker");
    const result = await updateMyTiebreakerScore({ score: 45, week: 1 });

    expect(result?.serverError).toContain("already started");
  });

  it("throws when the tiebreaker was already submitted", async () => {
    mockDb.executeTakeFirstOrThrow
      .mockResolvedValueOnce({ GameKickoff: FUTURE })
      .mockResolvedValueOnce({ TiebreakerHasSubmitted: 1, TiebreakerID: 9 });

    const { updateMyTiebreakerScore } = await import("./tiebreaker");
    const result = await updateMyTiebreakerScore({ score: 45, week: 1 });

    expect(result?.serverError).toContain("already been submitted");
  });

  it("updates the tiebreaker score on success", async () => {
    mockDb.executeTakeFirstOrThrow
      .mockResolvedValueOnce({ GameKickoff: FUTURE })
      .mockResolvedValueOnce({ TiebreakerHasSubmitted: 0, TiebreakerID: 9 })
      .mockResolvedValueOnce({});

    const { updateMyTiebreakerScore } = await import("./tiebreaker");
    const result = await updateMyTiebreakerScore({ score: 45, week: 1 });

    expect(result?.serverError).toBeUndefined();
    expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({ TiebreakerLastScore: 45 }));
    expect(revalidatePath).toHaveBeenCalledWith("/picks/set");
  });
});
