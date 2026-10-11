import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockDb, type MockDb } from "../test-utils/mockDb";

let mockDb: MockDb;

vi.mock("../kysely", () => ({
  get db() {
    return mockDb;
  },
}));

describe("getSurvivorMvCount", () => {
  beforeEach(() => {
    mockDb = createMockDb();
    vi.resetModules();
  });

  it("returns the SurvivorMV row count", async () => {
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ count: 7 });

    const { getSurvivorMvCount } = await import("./survivor");

    await expect(getSurvivorMvCount()).resolves.toBe(7);
    expect(mockDb.selectFrom).toHaveBeenCalledWith("SurvivorMV");
  });
});
