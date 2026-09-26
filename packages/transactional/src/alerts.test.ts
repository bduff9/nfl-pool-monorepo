import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockDb: MockDb;

const sendWeekEndedEmail = vi.fn();
const sendWeekEndedPushNotification = vi.fn();
const sendWeekEndedSMS = vi.fn();
const sendWeekStartedEmail = vi.fn();
const sendWeekStartedPushNotification = vi.fn();
const sendWeekStartedSMS = vi.fn();

vi.mock("@nfl-pool-monorepo/api/src/newsArticles", () => ({ getArticlesForWeek: vi.fn().mockResolvedValue([]) }));
vi.mock("@nfl-pool-monorepo/db/src/kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("../emails/weekEnded", () => ({ sendWeekEndedEmail }));
vi.mock("../emails/weekStarted", () => ({ sendWeekStartedEmail }));
vi.mock("../emails/weekly", () => ({ sendWeeklyEmail: vi.fn() }));
vi.mock("../pushNotifications/weekEnded", () => ({ default: sendWeekEndedPushNotification }));
vi.mock("../pushNotifications/weekStarted", () => ({ default: sendWeekStartedPushNotification }));
vi.mock("../sms/weekEnded", () => ({ default: sendWeekEndedSMS }));
vi.mock("../sms/weekStarted", () => ({ default: sendWeekStartedSMS }));

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
  sendWeekEndedEmail.mockReset().mockResolvedValue(undefined);
  sendWeekEndedPushNotification.mockReset().mockResolvedValue(undefined);
  sendWeekEndedSMS.mockReset().mockResolvedValue(undefined);
  sendWeekStartedEmail.mockReset().mockResolvedValue(undefined);
  sendWeekStartedPushNotification.mockReset().mockResolvedValue(undefined);
  sendWeekStartedSMS.mockReset().mockResolvedValue(undefined);
  vi.resetModules();
};

describe("sendWeekEndedNotifications", () => {
  beforeEach(resetAllMocks);

  it("sends week ended notifications on opted-in channels", async () => {
    mockDb.execute.mockResolvedValueOnce([{ ...USER, NotificationSMS: 0 }]);

    const { sendWeekEndedNotifications } = await import("./alerts");

    await sendWeekEndedNotifications(5);

    expect(sendWeekEndedEmail).toHaveBeenCalledTimes(1);
    expect(sendWeekEndedSMS).not.toHaveBeenCalled();
    expect(sendWeekEndedPushNotification).toHaveBeenCalledTimes(1);
  });

  it("continues with remaining users when one send fails", async () => {
    mockDb.execute.mockResolvedValueOnce([USER, { ...USER, UserEmail: "other@example.com" }]);
    sendWeekEndedEmail.mockRejectedValueOnce(new Error("SES down"));

    const { sendWeekEndedNotifications } = await import("./alerts");

    await sendWeekEndedNotifications(5);

    expect(sendWeekEndedEmail).toHaveBeenCalledTimes(2);
    expect(sendWeekEndedEmail.mock.calls[1]?.[1]).toBe(5);
  });
});

describe("sendWeekStartedNotifications", () => {
  beforeEach(resetAllMocks);

  it("sends week started notifications on opted-in channels", async () => {
    mockDb.execute.mockResolvedValueOnce([{ ...USER, NotificationEmail: 0, NotificationPushNotification: 0 }]);

    const { sendWeekStartedNotifications } = await import("./alerts");

    await sendWeekStartedNotifications(6);

    expect(sendWeekStartedEmail).not.toHaveBeenCalled();
    expect(sendWeekStartedSMS).toHaveBeenCalledTimes(1);
    expect(sendWeekStartedPushNotification).not.toHaveBeenCalled();
  });
});
