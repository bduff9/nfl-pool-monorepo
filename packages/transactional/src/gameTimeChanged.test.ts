import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockDb: MockDb;

const sendGameTimeChangedEmail = vi.fn();
const sendGameTimeChangedPushNotification = vi.fn();
const sendGameTimeChangedSMS = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("../emails/gameTimeChanged", () => ({ sendGameTimeChangedEmail }));
vi.mock("../pushNotifications/gameTimeChanged", () => ({ default: sendGameTimeChangedPushNotification }));
vi.mock("../sms/gameTimeChanged", () => ({ default: sendGameTimeChangedSMS }));

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
  sendGameTimeChangedEmail.mockReset().mockResolvedValue(undefined);
  sendGameTimeChangedPushNotification.mockReset().mockResolvedValue(undefined);
  sendGameTimeChangedSMS.mockReset().mockResolvedValue(undefined);
  vi.resetModules();
};

const NOON = new Date("2026-10-04T16:00:00Z");
const FIVE_HOURS_LATER = new Date("2026-10-04T21:00:00Z");
const FIVE_MINUTES_LATER = new Date("2026-10-04T16:05:00Z");

describe("sendGameTimeChangedNotifications", () => {
  beforeEach(resetAllMocks);

  it("does nothing when the kickoff only drifted by a few minutes", async () => {
    const { sendGameTimeChangedNotifications } = await import("./gameTimeChanged");

    await sendGameTimeChangedNotifications([{ gameID: 1, newKickoff: FIVE_MINUTES_LATER, oldKickoff: NOON, week: 5 }]);

    expect(mockDb.selectFrom).not.toHaveBeenCalled();
    expect(sendGameTimeChangedEmail).not.toHaveBeenCalled();
  });

  it("sends on every opted-in channel for users with a pick on the moved game", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce({
      homeTeamCity: "Seattle",
      homeTeamName: "Seahawks",
      visitorTeamCity: "New England",
      visitorTeamName: "Patriots",
    });
    mockDb.execute.mockResolvedValueOnce([USER]);

    const { sendGameTimeChangedNotifications } = await import("./gameTimeChanged");

    await sendGameTimeChangedNotifications([{ gameID: 1, newKickoff: FIVE_HOURS_LATER, oldKickoff: NOON, week: 5 }]);

    expect(sendGameTimeChangedEmail).toHaveBeenCalledTimes(1);
    const user = sendGameTimeChangedEmail.mock.calls[0]?.[0];
    const info = sendGameTimeChangedEmail.mock.calls[0]?.[1];
    expect(user?.UserEmail).toBe("user@example.com");
    expect(info?.homeTeamName).toBe("Seattle Seahawks");
    expect(info?.visitorTeamName).toBe("New England Patriots");
    expect(info?.week).toBe(5);
    expect(info?.newKickoffLabel).toContain("ET");
    expect(sendGameTimeChangedSMS).toHaveBeenCalledTimes(1);
    expect(sendGameTimeChangedPushNotification).toHaveBeenCalledTimes(1);
  });

  it("respects users whose channels are all off", async () => {
    mockDb.executeTakeFirst.mockResolvedValueOnce({
      homeTeamCity: "Seattle",
      homeTeamName: "Seahawks",
      visitorTeamCity: "New England",
      visitorTeamName: "Patriots",
    });
    mockDb.execute.mockResolvedValueOnce([
      { ...USER, NotificationEmail: 0, NotificationPushNotification: 0, NotificationSMS: 0 },
    ]);

    const { sendGameTimeChangedNotifications } = await import("./gameTimeChanged");

    await sendGameTimeChangedNotifications([{ gameID: 1, newKickoff: FIVE_HOURS_LATER, oldKickoff: NOON, week: 5 }]);

    expect(sendGameTimeChangedEmail).not.toHaveBeenCalled();
    expect(sendGameTimeChangedSMS).not.toHaveBeenCalled();
    expect(sendGameTimeChangedPushNotification).not.toHaveBeenCalled();
  });
});
