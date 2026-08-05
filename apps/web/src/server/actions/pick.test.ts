import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockDb: MockDb;

const getCurrentSession = vi.fn();
const sendPicksSubmittedEmail = vi.fn();
const sendPicksSubmittedSMS = vi.fn();
const sendPicksSubmittedPushNotification = vi.fn();
const revalidatePath = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("@/server/loaders/sessions", () => ({ getCurrentSession }));
vi.mock("@nfl-pool-monorepo/transactional/emails/picksSubmitted", () => ({ sendPicksSubmittedEmail }));
vi.mock("@nfl-pool-monorepo/transactional/emails/quickPickConfirmation", () => ({
  sendQuickPickConfirmationEmail: vi.fn(),
}));
vi.mock("@nfl-pool-monorepo/transactional/pushNotifications/picksSubmitted", () => ({
  default: sendPicksSubmittedPushNotification,
}));
vi.mock("@nfl-pool-monorepo/transactional/sms/picksSubmitted", () => ({ default: sendPicksSubmittedSMS }));
vi.mock("next/cache", () => ({ revalidatePath }));

const AUTHED_USER = {
  doneRegistering: 1,
  email: "user@example.com",
  id: 1,
  image: null,
  isAdmin: 0,
  name: "Test User",
  playsSurvivor: 0,
};

const FUTURE = new Date(Date.now() + 60 * 60 * 1000);

describe("submitMyPicks", () => {
  beforeEach(() => {
    mockDb = createMockDb();
    getCurrentSession.mockReset().mockResolvedValue({ session: { id: "s1" }, user: AUTHED_USER });
    sendPicksSubmittedEmail.mockReset();
    sendPicksSubmittedSMS.mockReset();
    sendPicksSubmittedPushNotification.mockReset();
    revalidatePath.mockReset();
    vi.resetModules();
  });

  it("throws when a pick's point value is out of sequence", async () => {
    mockDb.execute.mockResolvedValueOnce([{ GameKickoff: FUTURE, PickPoints: 2, TeamID: 5 }]);

    const { submitMyPicks } = await import("./pick");
    const result = await submitMyPicks({ week: 1 });

    expect(result?.serverError).toContain("Missing point value found");
    expect(mockDb.executeTakeFirstOrThrow).not.toHaveBeenCalled();
  });

  it("throws when a pick is missing a team and its game hasn't started", async () => {
    mockDb.execute.mockResolvedValueOnce([{ GameKickoff: FUTURE, PickPoints: 1, TeamID: null }]);

    const { submitMyPicks } = await import("./pick");
    const result = await submitMyPicks({ week: 1 });

    expect(result?.serverError).toContain("Missing team pick found");
  });

  it("throws when the tiebreaker score is not greater than zero and the last game hasn't started", async () => {
    mockDb.execute.mockResolvedValueOnce([{ GameKickoff: FUTURE, PickPoints: 1, TeamID: 5 }]);
    mockDb.executeTakeFirstOrThrow
      .mockResolvedValueOnce({ GameKickoff: FUTURE })
      .mockResolvedValueOnce({ TiebreakerID: 99, TiebreakerLastScore: 0 });

    const { submitMyPicks } = await import("./pick");
    const result = await submitMyPicks({ week: 1 });

    expect(result?.serverError).toContain("Tiebreaker last score must be greater than zero");
  });

  it("submits successfully and logs the action when no notifications are configured", async () => {
    mockDb.execute.mockResolvedValueOnce([{ GameKickoff: FUTURE, PickPoints: 1, TeamID: 5 }]).mockResolvedValueOnce([]);
    mockDb.executeTakeFirstOrThrow
      .mockResolvedValueOnce({ GameKickoff: FUTURE })
      .mockResolvedValueOnce({ TiebreakerID: 99, TiebreakerLastScore: 45 })
      .mockResolvedValueOnce({ numUpdatedRows: 1n });
    mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

    const { submitMyPicks } = await import("./pick");
    const result = await submitMyPicks({ week: 1 });

    expect(result?.serverError).toBeUndefined();
    expect(result?.data?.status).toBe("Success");
    expect(mockDb.insertInto).toHaveBeenCalledWith("Logs");
    expect(sendPicksSubmittedEmail).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/picks/view");
  });

  it("sends an email when the user has PicksSubmitted email notifications enabled", async () => {
    mockDb.execute.mockResolvedValueOnce([{ GameKickoff: FUTURE, PickPoints: 1, TeamID: 5 }]).mockResolvedValueOnce([]);
    mockDb.executeTakeFirstOrThrow
      .mockResolvedValueOnce({ GameKickoff: FUTURE })
      .mockResolvedValueOnce({ TiebreakerID: 99, TiebreakerLastScore: 45 })
      .mockResolvedValueOnce({ numUpdatedRows: 1n });
    mockDb.executeTakeFirst.mockResolvedValueOnce({
      NotificationEmail: 1,
      NotificationPushNotification: 0,
      NotificationSMS: 0,
    });

    const { submitMyPicks } = await import("./pick");
    await submitMyPicks({ week: 1 });

    expect(sendPicksSubmittedEmail).toHaveBeenCalledWith(AUTHED_USER, 1, 45);
    expect(sendPicksSubmittedSMS).not.toHaveBeenCalled();
  });
});
