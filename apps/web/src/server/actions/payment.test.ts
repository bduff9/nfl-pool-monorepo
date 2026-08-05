import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockDb: MockDb;

const getCurrentSession = vi.fn();
const revalidatePath = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("@/server/loaders/sessions", () => ({ getCurrentSession }));
vi.mock("next/cache", () => ({ revalidatePath }));

const ADMIN_USER = {
  doneRegistering: 1,
  email: "admin@example.com",
  id: 1,
  image: null,
  isAdmin: 1,
  name: "Admin User",
  playsSurvivor: 0,
};

const resetAllMocks = () => {
  mockDb = createMockDb();
  getCurrentSession.mockReset().mockResolvedValue({ session: { id: "s1" }, user: ADMIN_USER });
  revalidatePath.mockReset();
  vi.resetModules();
};

describe("insertUserPayout", () => {
  beforeEach(resetAllMocks);

  it("inserts a negative payout row for the user", async () => {
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({});

    const { insertUserPayout } = await import("./payment");
    const result = await insertUserPayout({ amount: 25, userID: 5 });

    expect(result?.serverError).toBeUndefined();
    expect(mockDb.values).toHaveBeenCalledWith(expect.objectContaining({ PaymentAmount: -25, UserID: 5 }));
  });
});

describe("updateUserPaid", () => {
  beforeEach(resetAllMocks);

  it("throws when the amount paid exceeds what's owed", async () => {
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ balance: "-10" });

    const { updateUserPaid } = await import("./payment");
    const result = await updateUserPaid({ amountPaid: 20, userID: 5 });

    expect(result?.serverError).toContain("greater than owed");
  });

  it("marks the user done registering when the balance reaches zero", async () => {
    mockDb.executeTakeFirstOrThrow
      .mockResolvedValueOnce({ balance: "-40" })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ UserDoneRegistering: 0, UserName: "Test User" })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const { updateUserPaid } = await import("./payment");
    const result = await updateUserPaid({ amountPaid: 40, userID: 5 });

    expect(result?.serverError).toBeUndefined();
    expect(mockDb.updateTable).toHaveBeenCalledWith("Users");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/users");
  });

  it("doesn't touch UserDoneRegistering when the user is already done registering", async () => {
    mockDb.executeTakeFirstOrThrow
      .mockResolvedValueOnce({ balance: "-40" })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ UserDoneRegistering: 1, UserName: "Test User" })
      .mockResolvedValueOnce({});

    const { updateUserPaid } = await import("./payment");
    const result = await updateUserPaid({ amountPaid: 40, userID: 5 });

    expect(result?.serverError).toBeUndefined();
    expect(mockDb.updateTable).not.toHaveBeenCalledWith("Users");
  });
});
