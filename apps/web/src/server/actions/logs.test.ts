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

  it("uses the explicit userId when one is provided", async () => {
    getCurrentSession.mockResolvedValue({ session: null, user: null });
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({});

    const { writeLog } = await import("./logs");
    await writeLog({ LogAction: "LOGOUT", LogData: null, LogMessage: "signed out", userId: 7 });

    expect(mockDb.values).toHaveBeenCalledWith(expect.objectContaining({ LogAddedBy: "7", UserID: 7 }));
  });

  it("falls back to the current session's user id when none is passed", async () => {
    getCurrentSession.mockResolvedValue({ session: { id: "s1" }, user: { id: 3 } });
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({});

    const { writeLog } = await import("./logs");
    await writeLog({ LogAction: "LOGOUT", LogData: null, LogMessage: "signed out" });

    expect(mockDb.values).toHaveBeenCalledWith(expect.objectContaining({ LogAddedBy: "3", UserID: 3 }));
  });

  it("falls back to 'unknown' when there's no session and no explicit userId", async () => {
    getCurrentSession.mockResolvedValue({ session: null, user: null });
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({});

    const { writeLog } = await import("./logs");
    await writeLog({ LogAction: "LOGOUT", LogData: null, LogMessage: "signed out" });

    expect(mockDb.values).toHaveBeenCalledWith(expect.objectContaining({ LogAddedBy: "unknown" }));
  });
});
