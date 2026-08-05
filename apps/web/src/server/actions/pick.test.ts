import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockDb: MockDb;

const getCurrentSession = vi.fn();
const sendPicksSubmittedEmail = vi.fn();
const sendPicksSubmittedSMS = vi.fn();
const sendPicksSubmittedPushNotification = vi.fn();
const sendQuickPickConfirmationEmail = vi.fn();
const getLowestUnusedPoint = vi.fn();
const revalidatePath = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("@/server/loaders/sessions", () => ({ getCurrentSession }));
vi.mock("@nfl-pool-monorepo/db/src/queries/pick", () => ({ getLowestUnusedPoint }));
vi.mock("@nfl-pool-monorepo/transactional/emails/picksSubmitted", () => ({ sendPicksSubmittedEmail }));
vi.mock("@nfl-pool-monorepo/transactional/emails/quickPickConfirmation", () => ({ sendQuickPickConfirmationEmail }));
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

describe("quickPick", () => {
  beforeEach(() => {
    mockDb = createMockDb();
    getCurrentSession.mockReset().mockResolvedValue({ session: { id: "s1" }, user: AUTHED_USER });
    getLowestUnusedPoint.mockReset();
    sendQuickPickConfirmationEmail.mockReset();
    vi.resetModules();
  });

  it("silently no-ops when the passed userId doesn't match the session user", async () => {
    getCurrentSession.mockResolvedValue({ session: { id: "s1" }, user: { ...AUTHED_USER, id: 2 } });

    const { quickPick } = await import("./pick");
    const result = await quickPick({ teamId: 5, userId: 1 });

    expect(result?.data?.status).toBe("Success");
    expect(mockDb.executeTakeFirstOrThrow).not.toHaveBeenCalled();
  });

  it("throws when no matching game is found", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

    const { quickPick } = await import("./pick");
    const result = await quickPick({ teamId: 5, userId: 1 });

    expect(result?.serverError).toContain("No matching game found");
  });

  it("throws when the pick has already been made", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce({ GameID: 500, GameWeek: 1 });
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ PickID: 1, PickPoints: 3, TeamID: 5, UserID: 1 });

    const { quickPick } = await import("./pick");
    const result = await quickPick({ teamId: 5, userId: 1 });

    expect(result?.serverError).toContain("Pick has already been made");
  });

  it("throws when there are no points left to use", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce({ GameID: 500, GameWeek: 1 });
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ PickID: 1, PickPoints: null, TeamID: null, UserID: 1 });
    getLowestUnusedPoint.mockResolvedValueOnce(null);

    const { quickPick } = await import("./pick");
    const result = await quickPick({ teamId: 5, userId: 1 });

    expect(result?.serverError).toContain("no points left to use");
  });

  it("updates the pick and sends a confirmation email on success", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce({ GameID: 500, GameWeek: 1 });
    mockDb.executeTakeFirstOrThrow
      .mockResolvedValueOnce({ PickID: 1, PickPoints: null, TeamID: null, UserID: 1 })
      .mockResolvedValueOnce({ numUpdatedRows: 1n });
    getLowestUnusedPoint.mockResolvedValueOnce(4);

    const { quickPick } = await import("./pick");
    const result = await quickPick({ teamId: 5, userId: 1 });

    expect(result?.data?.status).toBe("Success");
    expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({ PickPoints: 4, TeamID: 5 }));
    expect(sendQuickPickConfirmationEmail).toHaveBeenCalledWith(1, 5, 4, 1);
  });

  it("still succeeds even if the confirmation email fails to send", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce({ GameID: 500, GameWeek: 1 });
    mockDb.executeTakeFirstOrThrow
      .mockResolvedValueOnce({ PickID: 1, PickPoints: null, TeamID: null, UserID: 1 })
      .mockResolvedValueOnce({ numUpdatedRows: 1n });
    getLowestUnusedPoint.mockResolvedValueOnce(4);
    sendQuickPickConfirmationEmail.mockRejectedValueOnce(new Error("SMTP down"));

    const { quickPick } = await import("./pick");
    const result = await quickPick({ teamId: 5, userId: 1 });

    expect(result?.serverError).toBeUndefined();
    expect(result?.data?.status).toBe("Success");
  });
});

describe("setMyPick", () => {
  beforeEach(() => {
    mockDb = createMockDb();
    getCurrentSession.mockReset().mockResolvedValue({ session: { id: "s1" }, user: AUTHED_USER });
    revalidatePath.mockReset();
    vi.resetModules();
  });

  it("throws when trying to change a pick whose game has already started", async () => {
    const PAST = new Date(Date.now() - 60 * 60 * 1000);

    mockDb.executeTakeFirst.mockResolvedValueOnce({ GameKickoff: PAST, PickID: 10 });

    const { setMyPick } = await import("./pick");
    const result = await setMyPick({ gameID: 101, points: 1, teamID: 5, week: 1 });

    expect(result?.serverError).toContain("Game has already started");
  });

  it("throws when no pick exists that can be changed", async () => {
    mockDb.executeTakeFirst
      .mockResolvedValueOnce(undefined) // oldPick lookup (none with this point value)
      .mockResolvedValueOnce(undefined); // newPick lookup

    const { setMyPick } = await import("./pick");
    const result = await setMyPick({ gameID: 101, points: 1, teamID: 5, week: 1 });

    expect(result?.serverError).toContain("No pick found that can be changed");
  });

  it("throws when the team doesn't belong to the game", async () => {
    mockDb.executeTakeFirst
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ HomeTeamID: 1, PickID: 20, VisitorTeamID: 2 });

    const { setMyPick } = await import("./pick");
    const result = await setMyPick({ gameID: 101, points: 1, teamID: 3, week: 1 });

    expect(result?.serverError).toContain("Invalid team passed for pick");
  });

  it("throws when the point value exceeds the number of games in the week", async () => {
    mockDb.executeTakeFirst
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ HomeTeamID: 1, PickID: 20, VisitorTeamID: 2 });
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ count: 1 });

    const { setMyPick } = await import("./pick");
    const result = await setMyPick({ gameID: 101, points: 5, teamID: 1, week: 1 });

    expect(result?.serverError).toContain("Invalid point value passed for week");
  });

  it("clears the old pick and sets the new pick on success", async () => {
    mockDb.executeTakeFirst
      .mockResolvedValueOnce({ GameKickoff: FUTURE, PickID: 10 })
      .mockResolvedValueOnce({ HomeTeamID: 1, PickID: 20, VisitorTeamID: 2 });
    mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce({ count: 16 }).mockResolvedValueOnce({ numUpdatedRows: 1n });

    const { setMyPick } = await import("./pick");
    const result = await setMyPick({ gameID: 101, points: 1, teamID: 1, week: 1 });

    expect(result?.serverError).toBeUndefined();
    expect(mockDb.where).toHaveBeenCalledWith("PickID", "=", 10);
    expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({ PickPoints: null, TeamID: null }));
    expect(mockDb.where).toHaveBeenCalledWith("PickID", "=", 20);
    expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({ PickPoints: 1, TeamID: 1 }));
    expect(revalidatePath).toHaveBeenCalledWith("/picks/set");
  });
});
