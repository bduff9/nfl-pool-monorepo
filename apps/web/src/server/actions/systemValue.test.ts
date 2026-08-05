import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockDb: MockDb;

const getCurrentSession = vi.fn();
const revalidatePath = vi.fn();
const updateAllPayouts = vi.fn();
const getCurrentWeekInProgress = vi.fn();
const sendPrizesSetEmail = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("@/server/loaders/sessions", () => ({ getCurrentSession }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@nfl-pool-monorepo/db/src/mutations/payment", () => ({ updateAllPayouts }));
vi.mock("@nfl-pool-monorepo/db/src/queries/game", () => ({ getCurrentWeekInProgress }));
vi.mock("@nfl-pool-monorepo/transactional/emails/prizesSet", () => ({ sendPrizesSetEmail }));

const ADMIN_USER = {
  doneRegistering: 1,
  email: "admin@example.com",
  id: 1,
  image: null,
  isAdmin: 1,
  name: "Admin User",
  playsSurvivor: 0,
};

const INPUT = {
  overall1stPrize: 275,
  overall2ndPrize: 175,
  overall3rdPrize: 125,
  survivor1stPrize: 90,
  survivor2ndPrize: 50,
  weekly1stPrize: 25,
  weekly2ndPrize: 15,
};

describe("updatePayouts", () => {
  beforeEach(() => {
    mockDb = createMockDb();
    getCurrentSession.mockReset().mockResolvedValue({ session: { id: "s1" }, user: ADMIN_USER });
    revalidatePath.mockReset();
    updateAllPayouts.mockReset().mockResolvedValue(undefined);
    getCurrentWeekInProgress.mockReset().mockResolvedValue(5);
    sendPrizesSetEmail.mockReset().mockResolvedValue(undefined);
    vi.resetModules();
  });

  it("updates all three prize system values and recalculates payouts for the current week", async () => {
    mockDb.executeTakeFirstOrThrow.mockResolvedValue({});
    mockDb.execute.mockResolvedValueOnce([{ UserEmail: "a@example.com", UserFirstName: "A" }]);

    const { updatePayouts } = await import("./systemValue");
    const result = await updatePayouts(INPUT);

    expect(result?.serverError).toBeUndefined();
    expect(updateAllPayouts).toHaveBeenCalledWith(5, mockDb);
    expect(sendPrizesSetEmail).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalledWith("/admin/payments");
  });

  it("falls back to week 1 when no week is currently in progress", async () => {
    mockDb.executeTakeFirstOrThrow.mockResolvedValue({});
    mockDb.execute.mockResolvedValueOnce([]);
    getCurrentWeekInProgress.mockResolvedValue(null);

    const { updatePayouts } = await import("./systemValue");
    const result = await updatePayouts(INPUT);

    expect(result?.serverError).toBeUndefined();
    expect(updateAllPayouts).toHaveBeenCalledWith(1, mockDb);
  });

  it("doesn't let one failed prize email fail the whole action", async () => {
    mockDb.executeTakeFirstOrThrow.mockResolvedValue({});
    mockDb.execute.mockResolvedValueOnce([{ UserEmail: "a@example.com", UserFirstName: "A" }]);
    sendPrizesSetEmail.mockRejectedValue(new Error("SMTP down"));

    const { updatePayouts } = await import("./systemValue");
    const result = await updatePayouts(INPUT);

    expect(result?.serverError).toBeUndefined();
    expect(result?.data?.status).toBe("Success");
  });
});
