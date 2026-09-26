import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockDb, type MockDb } from "../test-utils/mockDb";

let mockDb: MockDb;

vi.mock("../kysely", () => ({
  get db() {
    return mockDb;
  },
}));

const resetAllMocks = () => {
  mockDb = createMockDb();
  vi.resetModules();
};

describe("getLowestUnusedPoint", () => {
  beforeEach(resetAllMocks);

  it("returns the lowest point not already used, ignoring null points", async () => {
    mockDb.execute.mockResolvedValueOnce([{ points: 1 }, { points: null }, { points: 3 }]);

    const { getLowestUnusedPoint } = await import("./pick");
    const point = await getLowestUnusedPoint(5, 1);

    expect(point).toBe(2);
  });

  it("returns null when every point up to the pick count is used", async () => {
    mockDb.execute.mockResolvedValueOnce([{ points: 1 }, { points: 2 }, { points: 3 }]);

    const { getLowestUnusedPoint } = await import("./pick");
    const point = await getLowestUnusedPoint(5, 1);

    expect(point).toBeNull();
  });

  it("returns 1 for a user with no used points", async () => {
    mockDb.execute.mockResolvedValueOnce([{ points: null }, { points: null }]);

    const { getLowestUnusedPoint } = await import("./pick");
    const point = await getLowestUnusedPoint(5, 1);

    expect(point).toBe(1);
  });

  it("returns null for a user with no picks in the week", async () => {
    mockDb.execute.mockResolvedValueOnce([]);

    const { getLowestUnusedPoint } = await import("./pick");
    const point = await getLowestUnusedPoint(5, 1);

    expect(point).toBeNull();
  });
});
