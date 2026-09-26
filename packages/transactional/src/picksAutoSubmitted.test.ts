import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockDb: MockDb;

const sendPicksAutoSubmittedEmail = vi.fn();
const sendPicksAutoSubmittedPushNotification = vi.fn();
const sendPicksAutoSubmittedSMS = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("../emails/picksAutoSubmitted", () => ({ sendPicksAutoSubmittedEmail }));
vi.mock("../pushNotifications/picksAutoSubmitted", () => ({ default: sendPicksAutoSubmittedPushNotification }));
vi.mock("../sms/picksAutoSubmitted", () => ({ default: sendPicksAutoSubmittedSMS }));

const USER = {
  NotificationEmail: 1,
  NotificationPushNotification: 1,
  NotificationSMS: 1,
  UserEmail: "user@example.com",
  UserFirstName: "Test",
  UserID: 1,
  UserPhone: "5551234567",
};

const resetAllMocks = () => {
  mockDb = createMockDb();
  sendPicksAutoSubmittedEmail.mockReset().mockResolvedValue(undefined);
  sendPicksAutoSubmittedPushNotification.mockReset().mockResolvedValue(undefined);
  sendPicksAutoSubmittedSMS.mockReset().mockResolvedValue(undefined);
  vi.resetModules();
};

describe("sendPicksAutoSubmittedNotifications", () => {
  beforeEach(resetAllMocks);

  it("does nothing when there are no auto-filled picks", async () => {
    const { sendPicksAutoSubmittedNotifications } = await import("./picksAutoSubmitted");

    await sendPicksAutoSubmittedNotifications(5, []);

    expect(mockDb.selectFrom).not.toHaveBeenCalled();
  });

  it("names the auto-picked team when the pick has one", async () => {
    mockDb.executeTakeFirst
      .mockResolvedValueOnce({
        homeTeamCity: "Seattle",
        homeTeamName: "Seahawks",
        pickedTeamID: 9,
        visitorTeamCity: "New England",
        visitorTeamName: "Patriots",
      })
      .mockResolvedValueOnce(USER)
      .mockResolvedValueOnce({ TeamCity: "New England", TeamName: "Patriots" });

    const { sendPicksAutoSubmittedNotifications } = await import("./picksAutoSubmitted");

    await sendPicksAutoSubmittedNotifications(5, [{ gameID: 1, pickPoints: 4, userID: 1 }]);

    expect(sendPicksAutoSubmittedEmail).toHaveBeenCalledTimes(1);
    const user = sendPicksAutoSubmittedEmail.mock.calls[0]?.[0];
    const info = sendPicksAutoSubmittedEmail.mock.calls[0]?.[1];
    expect(user?.UserEmail).toBe("user@example.com");
    expect(info?.pickedTeamName).toBe("New England Patriots");
    expect(info?.pickPoints).toBe(4);
    expect(info?.homeTeamName).toBe("Seattle Seahawks");
  });

  it("leaves the team unnamed when only points were assigned", async () => {
    mockDb.executeTakeFirst
      .mockResolvedValueOnce({
        homeTeamCity: "Seattle",
        homeTeamName: "Seahawks",
        pickedTeamID: null,
        visitorTeamCity: "New England",
        visitorTeamName: "Patriots",
      })
      .mockResolvedValueOnce(USER);

    const { sendPicksAutoSubmittedNotifications } = await import("./picksAutoSubmitted");

    await sendPicksAutoSubmittedNotifications(5, [{ gameID: 1, pickPoints: 4, userID: 1 }]);

    const user = sendPicksAutoSubmittedEmail.mock.calls[0]?.[0];
    const info = sendPicksAutoSubmittedEmail.mock.calls[0]?.[1];
    expect(user?.UserEmail).toBe("user@example.com");
    expect(info?.pickedTeamName).toBeUndefined();
    expect(info?.pickPoints).toBe(4);
    expect(sendPicksAutoSubmittedSMS).toHaveBeenCalledTimes(1);
  });
});
