import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { sendWeekEndedNotifications, sendWeekStartedNotifications } from "./alerts";

let mockDb: MockDb;

const sendWeekEndedEmail = vi.fn();
const sendWeekEndedPushNotification = vi.fn();
const sendWeekEndedSMS = vi.fn();
const sendWeekStartedEmail = vi.fn();
const sendWeekStartedPushNotification = vi.fn();
const sendWeekStartedSMS = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("../emails/weekEnded", () => ({ sendWeekEndedEmail: (...args: unknown[]) => sendWeekEndedEmail(...args) }));
vi.mock("../emails/weekStarted", () => ({
  sendWeekStartedEmail: (...args: unknown[]) => sendWeekStartedEmail(...args),
}));
vi.mock("../emails/weekly", () => ({ sendWeeklyEmail: vi.fn() }));
vi.mock("../pushNotifications/weekEnded", () => ({
  default: (...args: unknown[]) => sendWeekEndedPushNotification(...args),
}));
vi.mock("../pushNotifications/weekStarted", () => ({
  default: (...args: unknown[]) => sendWeekStartedPushNotification(...args),
}));
vi.mock("../sms/weekEnded", () => ({ default: (...args: unknown[]) => sendWeekEndedSMS(...args) }));
vi.mock("../sms/weekStarted", () => ({ default: (...args: unknown[]) => sendWeekStartedSMS(...args) }));

const USER = {
  NotificationEmail: 1,
  NotificationPushNotification: 1,
  NotificationSMS: 1,
  UserEmail: "user@example.com",
  UserFirstName: "Test",
  UserID: 1,
  UserPhone: "5551234567",
};

const record = () => ({
  consoleError: vi.mocked(console.error).mock.calls,
  consoleLog: vi.mocked(console.log).mock.calls,
  email: [sendWeekEndedEmail.mock.calls, sendWeekStartedEmail.mock.calls],
  push: [sendWeekEndedPushNotification.mock.calls, sendWeekStartedPushNotification.mock.calls],
  select: mockDb.select.mock.calls,
  sms: [sendWeekEndedSMS.mock.calls, sendWeekStartedSMS.mock.calls],
  where: mockDb.where.mock.calls.map((call) =>
    call.map((arg: unknown) => (typeof arg === "function" ? "<expression callback>" : arg)),
  ),
});

describe("week notification queries and logging", () => {
  beforeEach(() => {
    mockDb = createMockDb();
    for (const send of [
      sendWeekEndedEmail,
      sendWeekEndedPushNotification,
      sendWeekEndedSMS,
      sendWeekStartedEmail,
      sendWeekStartedPushNotification,
      sendWeekStartedSMS,
    ]) {
      send.mockReset().mockResolvedValue(undefined);
    }

    vi.spyOn(console, "log")
      .mockReset()
      .mockImplementation(() => undefined);
    vi.spyOn(console, "error")
      .mockReset()
      .mockImplementation(() => undefined);
  });

  it.each([
    ["week ended", sendWeekEndedNotifications],
    ["week started", sendWeekStartedNotifications],
  ])("queries and dispatches %s notifications", async (_name, send) => {
    mockDb.execute.mockResolvedValueOnce([USER, { ...USER, NotificationEmail: 0, UserEmail: "b@example.com" }]);
    await send(5);

    expect(record()).toMatchSnapshot();
  });

  it.each([
    ["week ended", sendWeekEndedNotifications, sendWeekEndedEmail],
    ["week started", sendWeekStartedNotifications, sendWeekStartedEmail],
  ])("logs a failed %s send and carries on", async (_name, send, sendEmail) => {
    mockDb.execute.mockResolvedValueOnce([USER, { ...USER, UserEmail: "b@example.com" }]);
    sendEmail.mockRejectedValueOnce(new Error("SES down"));
    await send(5);

    expect(record()).toMatchSnapshot();
  });
});
