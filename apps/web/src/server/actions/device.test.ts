import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockDb: MockDb;

const getCurrentSession = vi.fn();
const setVapidDetails = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("@/server/loaders/sessions", () => ({ getCurrentSession }));
vi.mock("web-push", () => ({ default: { setVapidDetails } }));
vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_VAPID_PUBLIC_KEY: "public-key", VAPID_PRIVATE_KEY: "private-key" },
}));

const AUTHED_USER = {
  doneRegistering: 1,
  email: "user@example.com",
  id: 1,
  image: null,
  isAdmin: 0,
  name: "Test User",
  playsSurvivor: 0,
};

describe("device actions", () => {
  beforeEach(() => {
    mockDb = createMockDb();
    getCurrentSession.mockReset().mockResolvedValue({ session: { id: "s1" }, user: AUTHED_USER });
    vi.resetModules();
  });

  it("subscribeUser inserts a new device row for the user", async () => {
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({});

    const { subscribeUser } = await import("./device");
    const result = await subscribeUser({ agent: "Chrome", subscription: "sub-json" });

    expect(result?.serverError).toBeUndefined();
    expect(mockDb.values).toHaveBeenCalledWith(expect.objectContaining({ DeviceSub: "sub-json", UserID: 1 }));
  });

  it("unsubscribeUser deletes the matching device row for the user", async () => {
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({});

    const { unsubscribeUser } = await import("./device");
    const result = await unsubscribeUser({ agent: "Chrome", subscription: "sub-json" });

    expect(result?.serverError).toBeUndefined();
    expect(mockDb.deleteFrom).toHaveBeenCalledWith("Devices");
  });
});
