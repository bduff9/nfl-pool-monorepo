import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockDb: MockDb;

const getCurrentSession = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("@/server/loaders/sessions", () => ({ getCurrentSession }));

describe("writeLog", () => {
  beforeEach(() => {
    mockDb = createMockDb();
    getCurrentSession.mockReset();
    vi.resetModules();
  });

  it("attributes the log entry to the current session's user", async () => {
    getCurrentSession.mockResolvedValue({ session: { id: "s1" }, user: { id: 3 } });
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({});

    const { writeLog } = await import("./logs");
    await writeLog({ LogAction: "LOGOUT", LogData: null, LogMessage: "signed out" });

    expect(mockDb.values).toHaveBeenCalledWith(expect.objectContaining({ LogAddedBy: "3", UserID: 3 }));
  });

  it("falls back to 'unknown' when there's no session", async () => {
    getCurrentSession.mockResolvedValue({ session: null, user: null });
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({});

    const { writeLog } = await import("./logs");
    await writeLog({ LogAction: "LOGOUT", LogData: null, LogMessage: "signed out" });

    expect(mockDb.values).toHaveBeenCalledWith(expect.objectContaining({ LogAddedBy: "unknown" }));
  });

  it("silently succeeds when the same user+action is logged twice within the same second", async () => {
    getCurrentSession.mockResolvedValue({ session: null, user: null });

    const duplicateEntryError = Object.assign(new Error("Duplicate entry"), { code: "ER_DUP_ENTRY" });

    mockDb.executeTakeFirstOrThrow.mockRejectedValueOnce(duplicateEntryError);

    const { writeLog } = await import("./logs");
    const result = await writeLog({ LogAction: "404", LogData: null, LogMessage: "/some-path" });

    expect(result.status).toBe("Success");
  });

  it("rethrows non-duplicate-key errors", async () => {
    getCurrentSession.mockResolvedValue({ session: null, user: null });

    mockDb.executeTakeFirstOrThrow.mockRejectedValueOnce(new Error("connection lost"));

    const { writeLog } = await import("./logs");

    await expect(writeLog({ LogAction: "404", LogData: null, LogMessage: "/some-path" })).rejects.toThrow(
      "connection lost",
    );
  });
});
