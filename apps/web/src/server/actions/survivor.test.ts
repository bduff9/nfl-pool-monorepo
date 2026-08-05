import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockDb: MockDb;

const getCurrentSession = vi.fn();
const revalidatePath = vi.fn();
const registerUserForSurvivor = vi.fn();
const unregisterUserForSurvivor = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("@/server/loaders/sessions", () => ({ getCurrentSession }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@nfl-pool-monorepo/db/src/mutations/users", () => ({ registerUserForSurvivor, unregisterUserForSurvivor }));

const AUTHED_USER = {
  doneRegistering: 1,
  email: "user@example.com",
  id: 1,
  image: null,
  isAdmin: 0,
  name: "Test User",
  playsSurvivor: 1,
};

const ADMIN_USER = { ...AUTHED_USER, isAdmin: 1 };

const resetAllMocks = () => {
  mockDb = createMockDb();
  getCurrentSession.mockReset().mockResolvedValue({ session: { id: "s1" }, user: AUTHED_USER });
  revalidatePath.mockReset();
  registerUserForSurvivor.mockReset().mockResolvedValue(undefined);
  unregisterUserForSurvivor.mockReset().mockResolvedValue(undefined);
  vi.resetModules();
};

describe("makeSurvivorPick", () => {
  beforeEach(resetAllMocks);

  it("throws when the user doesn't play survivor", async () => {
    getCurrentSession.mockResolvedValue({ session: { id: "s1" }, user: { ...AUTHED_USER, playsSurvivor: 0 } });

    const { makeSurvivorPick } = await import("./survivor");
    const result = await makeSurvivorPick({ gameID: 101, teamID: 5, week: 1 });

    expect(result?.serverError).toContain("already out of survivor");
  });

  it("throws when the user is already eliminated overall", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce({ IsAliveOverall: 0 });

    const { makeSurvivorPick } = await import("./survivor");
    const result = await makeSurvivorPick({ gameID: 101, teamID: 5, week: 1 });

    expect(result?.serverError).toContain("already out of survivor");
  });

  it("throws when the week has already started", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce({ IsAliveOverall: 1 });
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ count: 1 });

    const { makeSurvivorPick } = await import("./survivor");
    const result = await makeSurvivorPick({ gameID: 101, teamID: 5, week: 1 });

    expect(result?.serverError).toContain("already started");
  });

  it("throws when the team doesn't belong to the given game", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce({ IsAliveOverall: 1 });
    mockDb.executeTakeFirstOrThrow
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ HomeTeamID: 8, VisitorTeamID: 9 });

    const { makeSurvivorPick } = await import("./survivor");
    const result = await makeSurvivorPick({ gameID: 101, teamID: 5, week: 1 });

    expect(result?.serverError).toContain("Invalid game and team");
  });

  it("saves the pick and logs it on success", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce({ IsAliveOverall: 1 });
    mockDb.executeTakeFirstOrThrow
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ HomeTeamID: 5, VisitorTeamID: 9 })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const { makeSurvivorPick } = await import("./survivor");
    const result = await makeSurvivorPick({ gameID: 101, teamID: 5, week: 1 });

    expect(result?.serverError).toBeUndefined();
    expect(result?.data?.status).toBe("Success");
    expect(revalidatePath).toHaveBeenCalledWith("/survivor/set");
  });
});

describe("registerForSurvivor", () => {
  beforeEach(resetAllMocks);

  it("throws when already registered for survivor", async () => {
    const { registerForSurvivor } = await import("./survivor");
    const result = await registerForSurvivor();

    expect(result?.serverError).toContain("Already registered");
  });

  it("registers the user for survivor", async () => {
    getCurrentSession.mockResolvedValue({ session: { id: "s1" }, user: { ...AUTHED_USER, playsSurvivor: 0 } });

    const { registerForSurvivor } = await import("./survivor");
    const result = await registerForSurvivor();

    expect(result?.serverError).toBeUndefined();
    expect(registerUserForSurvivor).toHaveBeenCalledWith(mockDb, 1);
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });
});

describe("toggleUserSurvivor", () => {
  beforeEach(() => {
    resetAllMocks();
    getCurrentSession.mockResolvedValue({ session: { id: "s1" }, user: ADMIN_USER });
  });

  it("registers the target user when playsSurvivor is 1", async () => {
    const { toggleUserSurvivor } = await import("./survivor");
    const result = await toggleUserSurvivor({ playsSurvivor: 1, userID: 5 });

    expect(result?.serverError).toBeUndefined();
    expect(registerUserForSurvivor).toHaveBeenCalledWith(mockDb, 5);
    expect(unregisterUserForSurvivor).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/admin/users");
  });

  it("unregisters the target user when playsSurvivor is 0", async () => {
    const { toggleUserSurvivor } = await import("./survivor");
    const result = await toggleUserSurvivor({ playsSurvivor: 0, userID: 5 });

    expect(result?.serverError).toBeUndefined();
    expect(unregisterUserForSurvivor).toHaveBeenCalledWith(mockDb, 5);
    expect(registerUserForSurvivor).not.toHaveBeenCalled();
  });
});

describe("unregisterForSurvivor", () => {
  beforeEach(resetAllMocks);

  it("throws when not registered for survivor", async () => {
    getCurrentSession.mockResolvedValue({ session: { id: "s1" }, user: { ...AUTHED_USER, playsSurvivor: 0 } });

    const { unregisterForSurvivor } = await import("./survivor");
    const result = await unregisterForSurvivor();

    expect(result?.serverError).toContain("Not registered");
  });

  it("unregisters the user", async () => {
    const { unregisterForSurvivor } = await import("./survivor");
    const result = await unregisterForSurvivor();

    expect(result?.serverError).toBeUndefined();
    expect(unregisterUserForSurvivor).toHaveBeenCalledWith(mockDb, 1);
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });
});
