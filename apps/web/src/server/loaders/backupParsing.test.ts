import { describe, expect, it } from "vitest";

import { parseBackupName } from "./backupParsing";

describe("parseBackupName", () => {
  it("parses an AM backup", () => {
    expect(parseBackupName("nfl-2024-01-05-AM.sql")).toEqual({
      backupDate: new Date("2024-01-05"),
      backupName: "nfl-2024-01-05-AM.sql",
      backupWhen: "AM",
    });
  });

  it("parses a PM backup", () => {
    expect(parseBackupName("nfl-2024-01-05-PM.sql")?.backupWhen).toBe("PM");
  });

  it("returns null for an invalid AM/PM segment", () => {
    expect(parseBackupName("nfl-2024-01-05-XX.sql")).toBeNull();
  });

  it("returns null for an empty name", () => {
    expect(parseBackupName("")).toBeNull();
  });
});
