import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const unlink = vi.fn();
const createReadStream = vi.fn();
const mysqldump = vi.fn();
const s3Send = vi.fn();
const uploadDone = vi.fn();
const getBackupName = vi.fn();
const parseDbUrl = vi.fn();

vi.mock("node:fs", () => ({
  createReadStream,
  promises: { unlink },
}));
vi.mock("mysqldump", () => ({ default: mysqldump }));
vi.mock("@nfl-pool-monorepo/utils/database", () => ({ getBackupName, parseDbUrl }));
vi.mock("@aws-sdk/client-s3", () => ({
  DeleteObjectCommand: class {
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
    }
  },
  ListObjectsV2Command: class {
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
    }
  },
  S3Client: class {
    send = s3Send;
  },
}));
vi.mock("@aws-sdk/lib-storage", () => ({
  Upload: class {
    input: unknown;
    done = uploadDone;
    constructor(input: unknown) {
      this.input = input;
    }
  },
}));

const originalEnv = { ...process.env };

const resetAllMocks = () => {
  createReadStream.mockReset().mockReturnValue("dump-stream");
  unlink.mockReset().mockResolvedValue(undefined);
  uploadDone.mockReset().mockResolvedValue(undefined);
  mysqldump.mockReset().mockResolvedValue(undefined);
  getBackupName.mockReset().mockReturnValue("NFLBackup-2026-01-01-AM.sql");
  parseDbUrl.mockReset().mockReturnValue({ database: "NFL", host: "localhost" });
  s3Send.mockReset();
  process.env.DATABASE_URL = "mysql://user:pass@localhost:3306/NFL";
  process.env.BACKUP_BUCKET_NAME = "backup-bucket";
  process.env.BACKUP_KEEP_COUNT = "2";
  vi.resetModules();
};

describe("backupNflDatabase handler", () => {
  beforeEach(resetAllMocks);

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("streams the dump to S3 without reading it into memory", async () => {
    s3Send.mockResolvedValue({ Contents: [] });

    const { handler } = await import("./backupNflDatabase");
    await handler(null as never, null as never, null as never);

    expect(createReadStream).toHaveBeenCalledWith("/tmp/NFLBackup-2026-01-01-AM.sql");
    expect(uploadDone).toHaveBeenCalledTimes(1);
  });

  it("deletes only the oldest backups beyond the configured keep count", async () => {
    s3Send.mockImplementation((command) => {
      if (command.constructor.name === "ListObjectsV2Command") {
        return Promise.resolve({
          Contents: [
            { Key: "NFLBackup-2026-01-01-AM.sql" },
            { Key: "NFLBackup-2026-01-02-AM.sql" },
            { Key: "NFLBackup-2026-01-03-AM.sql" },
            { Key: "NFLBackup-2026-01-04-AM.sql" },
          ],
        });
      }
      return Promise.resolve({});
    });

    const { handler } = await import("./backupNflDatabase");
    await handler(null as never, null as never, null as never);

    const deletedKeys = s3Send.mock.calls
      .map(([command]) => command)
      .filter((command) => command.constructor.name === "DeleteObjectCommand")
      .map((command) => command.input.Key);

    expect(deletedKeys).toEqual(["NFLBackup-2026-01-01-AM.sql", "NFLBackup-2026-01-02-AM.sql"]);
  });

  it("deletes nothing when the backup count is within the keep count", async () => {
    s3Send.mockImplementation((command) => {
      if (command.constructor.name === "ListObjectsV2Command") {
        return Promise.resolve({ Contents: [{ Key: "NFLBackup-2026-01-01-AM.sql" }] });
      }
      return Promise.resolve({});
    });

    const { handler } = await import("./backupNflDatabase");
    await handler(null as never, null as never, null as never);

    const deleteCalls = s3Send.mock.calls.filter(([command]) => command.constructor.name === "DeleteObjectCommand");

    expect(deleteCalls).toHaveLength(0);
  });
});
