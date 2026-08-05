import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockDb: MockDb;

const getCurrentSession = vi.fn();
const revalidatePath = vi.fn();
const redirect = vi.fn();
const deleteSessionTokenCookie = vi.fn();
const invalidateSession = vi.fn();
const writeLog = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("../loaders/sessions", () => ({ getCurrentSession }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/auth", () => ({ deleteSessionTokenCookie, invalidateSession }));
vi.mock("./logs", () => ({ writeLog }));

const AUTHED_USER = {
  doneRegistering: 1,
  email: "user@example.com",
  id: 1,
  image: null,
  isAdmin: 0,
  name: "Test User",
  playsSurvivor: 0,
};

describe("signOut", () => {
  beforeEach(() => {
    mockDb = createMockDb();
    getCurrentSession.mockReset();
    revalidatePath.mockReset();
    redirect.mockReset();
    deleteSessionTokenCookie.mockReset().mockResolvedValue(undefined);
    invalidateSession.mockReset().mockResolvedValue(undefined);
    writeLog.mockReset().mockResolvedValue(undefined);
    vi.resetModules();
  });

  it("redirects to login without touching the session when no user is logged in", async () => {
    getCurrentSession.mockResolvedValue({ session: null, user: null });

    const { signOut } = await import("./sessions");
    await signOut();

    expect(invalidateSession).not.toHaveBeenCalled();
    expect(writeLog).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/auth/login");
  });

  it("logs, invalidates the session, clears the cookie, and redirects when a user is logged in", async () => {
    getCurrentSession.mockResolvedValue({ session: { id: "s1" }, user: AUTHED_USER });
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ UserName: "Test User" });

    const { signOut } = await import("./sessions");
    await signOut();

    expect(writeLog).toHaveBeenCalledWith(expect.objectContaining({ LogAction: "LOGOUT" }));
    expect(invalidateSession).toHaveBeenCalledWith("s1");
    expect(deleteSessionTokenCookie).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(redirect).toHaveBeenCalledWith("/auth/login");
  });

  it("still signs the user out when writing the audit log fails", async () => {
    getCurrentSession.mockResolvedValue({ session: { id: "s1" }, user: AUTHED_USER });
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ UserName: "Test User" });
    writeLog.mockRejectedValue(new Error("db down"));

    const { signOut } = await import("./sessions");
    await signOut();

    expect(invalidateSession).toHaveBeenCalledWith("s1");
    expect(redirect).toHaveBeenCalledWith("/auth/login");
  });
});
