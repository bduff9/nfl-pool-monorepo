import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockDb, type MockDb } from "../test-utils/mockDb";

let mockDb: MockDb;

const getUserPayments = vi.fn();
const getSurvivorCost = vi.fn();
const unregisterUserForSurvivor = vi.fn();

vi.mock("../kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("../queries/payment", () => ({ getUserPayments }));
vi.mock("../queries/systemValue", () => ({ getSurvivorCost }));
vi.mock("./users", () => ({ unregisterUserForSurvivor }));

describe("markEmptySurvivorPicksAsDead", () => {
  beforeEach(() => {
    mockDb = createMockDb();
    getUserPayments.mockReset();
    getSurvivorCost.mockReset();
    unregisterUserForSurvivor.mockReset();
    vi.resetModules();
  });

  it("does not run the week-1 unregister check for later weeks", async () => {
    mockDb.execute.mockResolvedValueOnce([]);

    const { markEmptySurvivorPicksAsDead } = await import("./survivorPick");
    await markEmptySurvivorPicksAsDead(3);

    expect(getUserPayments).not.toHaveBeenCalled();
    expect(unregisterUserForSurvivor).not.toHaveBeenCalled();
  });

  it("unregisters a week-1 user whose balance is at or below the negative survivor cost", async () => {
    mockDb.execute.mockResolvedValueOnce([{ UserID: 10 }]).mockResolvedValueOnce([]);
    getUserPayments.mockResolvedValueOnce(-5);
    getSurvivorCost.mockResolvedValueOnce(5);

    const { markEmptySurvivorPicksAsDead } = await import("./survivorPick");
    await markEmptySurvivorPicksAsDead(1);

    expect(unregisterUserForSurvivor).toHaveBeenCalledWith(mockDb, 10, "Admin", true);
  });

  it("does not unregister a week-1 user whose balance is above the negative survivor cost", async () => {
    mockDb.execute.mockResolvedValueOnce([{ UserID: 10 }]).mockResolvedValueOnce([]);
    getUserPayments.mockResolvedValueOnce(-3);
    getSurvivorCost.mockResolvedValueOnce(5);

    const { markEmptySurvivorPicksAsDead } = await import("./survivorPick");
    await markEmptySurvivorPicksAsDead(1);

    expect(unregisterUserForSurvivor).not.toHaveBeenCalled();
  });

  it("marks users with no pick for the week as dead", async () => {
    mockDb.execute.mockResolvedValueOnce([{ UserID: 20 }, { UserID: 21 }]);
    mockDb.executeTakeFirstOrThrow.mockResolvedValue({ numUpdatedRows: 1n });

    const { markEmptySurvivorPicksAsDead } = await import("./survivorPick");
    await markEmptySurvivorPicksAsDead(4);

    expect(mockDb.executeTakeFirstOrThrow).toHaveBeenCalledTimes(2);
    expect(mockDb.where).toHaveBeenCalledWith("UserID", "=", 20);
    expect(mockDb.where).toHaveBeenCalledWith("UserID", "=", 21);
  });
});

describe("markWrongSurvivorPicksAsDead", () => {
  beforeEach(() => {
    mockDb = createMockDb();
    vi.resetModules();
  });

  it("marks every user who picked the losing team as dead", async () => {
    mockDb.execute.mockResolvedValueOnce([{ UserID: 30 }]);
    mockDb.executeTakeFirstOrThrow.mockResolvedValue({ numUpdatedRows: 1n });

    const { markWrongSurvivorPicksAsDead } = await import("./survivorPick");
    await markWrongSurvivorPicksAsDead(5, 99);

    expect(mockDb.where).toHaveBeenCalledWith("TeamID", "=", 99);
    expect(mockDb.executeTakeFirstOrThrow).toHaveBeenCalledTimes(1);
  });

  it("does nothing when no one picked the losing team", async () => {
    mockDb.execute.mockResolvedValueOnce([]);

    const { markWrongSurvivorPicksAsDead } = await import("./survivorPick");
    await markWrongSurvivorPicksAsDead(5, 99);

    expect(mockDb.executeTakeFirstOrThrow).not.toHaveBeenCalled();
  });
});
