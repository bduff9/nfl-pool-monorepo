import { afterEach, describe, expect, it, vi } from "vitest";

import { getBackupName, parseDbUrl } from "./database";

describe("parseDbUrl", () => {
  it("parses a valid MySQL URL into connection options", () => {
    const url = "mysql://admin:secret@localhost:3306/nfl_pool";
    const result = parseDbUrl(url);
    expect(result).toEqual({
      database: "nfl_pool",
      host: "localhost",
      password: "secret",
      port: 3306,
      user: "admin",
    });
  });

  it("handles passwords with special characters", () => {
    const url = "mysql://root:p@ssw0rd!#$@db.example.com:3307/my_db";
    const result = parseDbUrl(url);
    expect(result.user).toBe("root");
    expect(result.host).toBe("db.example.com");
    expect(result.port).toBe(3307);
    expect(result.database).toBe("my_db");
  });

  it("throws for an empty string", () => {
    expect(() => parseDbUrl("")).toThrow("Invalid database URL");
  });

  it("throws for a postgres:// URL", () => {
    expect(() => parseDbUrl("postgres://user:pass@host:5432/db")).toThrow("Invalid database URL");
  });

  it("throws when port is missing", () => {
    expect(() => parseDbUrl("mysql://user:pass@host/db")).toThrow("Invalid database URL");
  });

  it("converts port string to a number", () => {
    const result = parseDbUrl("mysql://u:p@h:5555/d");
    expect(typeof result.port).toBe("number");
    expect(result.port).toBe(5555);
  });
});

describe("getBackupName", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns an AM backup name for morning times", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-09-07T08:00:00"));
    const name = getBackupName();
    expect(name).toBe("NFLBackup-2025-09-07-AM.sql");
  });

  it("returns a PM backup name for afternoon times", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-09-07T14:00:00"));
    const name = getBackupName();
    expect(name).toBe("NFLBackup-2025-09-07-PM.sql");
  });

  it("zero-pads single-digit months and days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-05T10:00:00"));
    const name = getBackupName();
    expect(name).toBe("NFLBackup-2025-01-05-AM.sql");
  });

  it("treats exactly noon (12:00) as PM", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T12:00:00"));
    const name = getBackupName();
    expect(name).toContain("-PM.sql");
  });

  it("treats midnight (00:00) as AM", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T00:00:00"));
    const name = getBackupName();
    expect(name).toContain("-AM.sql");
  });
});
