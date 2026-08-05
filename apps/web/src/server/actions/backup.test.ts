import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockDb: MockDb;

const getCurrentSession = vi.fn();
const executeSqlFile = vi.fn();
const s3Send = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("@/server/loaders/sessions", () => ({ getCurrentSession }));
vi.mock("@nfl-pool-monorepo/utils/database", () => ({ executeSqlFile }));
vi.mock("@/lib/env", () => ({
  env: { AWS_AK_ID: "ak", AWS_R: "us-east-2", AWS_SAK_ID: "sak", BACKUP_BUCKET_NAME: "bucket" },
}));
vi.mock("@aws-sdk/client-s3", () => ({
  GetObjectCommand: class {
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
    }
  },
  S3Client: class {
    send = s3Send;
  },
}));

const ADMIN_USER = {
  doneRegistering: 1,
  email: "admin@example.com",
  id: 1,
  image: null,
  isAdmin: 1,
  name: "Admin User",
  playsSurvivor: 0,
};

describe("restoreBackup", () => {
  beforeEach(() => {
    mockDb = createMockDb();
    getCurrentSession.mockReset().mockResolvedValue({ session: { id: "s1" }, user: ADMIN_USER });
    executeSqlFile.mockReset().mockResolvedValue(undefined);
    s3Send.mockReset();
    vi.resetModules();
  });

  it("throws when the S3 object has no readable body", async () => {
    s3Send.mockResolvedValue({ Body: undefined });

    const { restoreBackup } = await import("./backup");
    const result = await restoreBackup({ backupName: "NFLBackup-2026-01-01.sql" });

    expect(result?.serverError).toContain("readable stream");
    expect(executeSqlFile).not.toHaveBeenCalled();
  });

  it("executes the fetched SQL dump and logs the restore on success", async () => {
    s3Send.mockResolvedValue({ Body: { transformToString: vi.fn().mockResolvedValue("SQL DUMP CONTENTS") } });
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({});

    const { restoreBackup } = await import("./backup");
    const result = await restoreBackup({ backupName: "NFLBackup-2026-01-01.sql" });

    expect(result?.serverError).toBeUndefined();
    expect(executeSqlFile).toHaveBeenCalledWith("SQL DUMP CONTENTS");
    expect(mockDb.values).toHaveBeenCalledWith(expect.objectContaining({ LogAction: "BACKUP_RESTORE" }));
  });
});
