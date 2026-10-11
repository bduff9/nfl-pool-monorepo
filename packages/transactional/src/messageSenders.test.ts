import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PickReminderEmail from "../emails/templates/PickReminder";
import SurvivorReminderEmail from "../emails/templates/SurvivorReminder";
import WeekEndedEmail from "../emails/templates/WeekEndedEmail";
import WeekStartedEmail from "../emails/templates/WeekStartedEmail";
import sendPickReminderPushNotification from "../pushNotifications/pickReminder";
import sendSurvivorReminderPushNotification from "../pushNotifications/survivorReminder";
import sendWeekEndedPushNotification from "../pushNotifications/weekEnded";
import sendWeekStartedPushNotification from "../pushNotifications/weekStarted";
import sendPickReminderSMS from "../sms/pickReminder";
import sendSurvivorReminderSMS from "../sms/survivorReminder";
import sendWeekEndedSMS from "../sms/weekEnded";
import sendWeekStartedSMS from "../sms/weekStarted";

let mockDb: MockDb;

const sendPushNotification = vi.fn();
const sendSMS = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("./env", () => ({ env: { domain: "https://pool.test" } }));
vi.mock("../pushNotifications", () => ({
  sendPushNotification: (...args: unknown[]) => sendPushNotification(...args),
}));
vi.mock("../sms", () => ({ sendSMS: (...args: unknown[]) => sendSMS(...args) }));

const HOME = {
  GameHomeScore: 21,
  GameVisitorScore: 14,
  TeamCity: "Chicago",
  TeamName: "Bears",
  TeamPrimaryColor: "#061E3E",
  TeamSecondaryColor: "#DF6108",
};
const VISITOR = {
  TeamCity: "New York",
  TeamName: "Giants",
  TeamPrimaryColor: "#03497F",
  TeamSecondaryColor: "#FFFFFF",
};

const PUSH_USER = { UserFirstName: "Pat", UserID: 7 };
const SMS_USER = { UserFirstName: "Pat", UserPhone: "5551234567" };
const NO_PHONE_USER = { UserFirstName: "Pat", UserPhone: null };

const prepareWeekStarted = () => {
  mockDb.executeTakeFirstOrThrow.mockResolvedValueOnce(HOME).mockResolvedValueOnce(VISITOR);
};
const prepareWeekEnded = (home = HOME, winner = HOME) => {
  mockDb.executeTakeFirstOrThrow
    .mockResolvedValueOnce(home)
    .mockResolvedValueOnce(VISITOR)
    .mockResolvedValueOnce(winner);
};
const TIE = { ...HOME, GameHomeScore: 17, GameVisitorScore: 17 };
const VISITOR_WON = { ...HOME, GameHomeScore: 10, GameVisitorScore: 17 };

const record = () => ({
  consoleError: vi.mocked(console.error).mock.calls,
  sendPushNotification: sendPushNotification.mock.calls,
  sendSMS: sendSMS.mock.calls,
});

describe("push notification and sms senders", () => {
  beforeEach(() => {
    mockDb = createMockDb();
    sendPushNotification.mockReset().mockResolvedValue(undefined);
    sendSMS.mockReset().mockResolvedValue(undefined);
    vi.spyOn(console, "error")
      .mockReset()
      .mockImplementation(() => undefined);
  });

  it("sends the week ended push notification", async () => {
    prepareWeekEnded();
    await sendWeekEndedPushNotification(PUSH_USER, 5);

    expect(record()).toMatchSnapshot();
  });

  it("sends the week ended push notification for a visitor win", async () => {
    prepareWeekEnded(VISITOR_WON, { ...VISITOR, ...VISITOR_WON });
    await sendWeekEndedPushNotification(PUSH_USER, 5);

    expect(record()).toMatchSnapshot();
  });

  it("sends the week ended push notification for a tie", async () => {
    prepareWeekEnded(TIE);
    await sendWeekEndedPushNotification(PUSH_USER, 5);

    expect(record()).toMatchSnapshot();
  });

  it("sends the week started push notification", async () => {
    prepareWeekStarted();
    await sendWeekStartedPushNotification(PUSH_USER, 5);

    expect(record()).toMatchSnapshot();
  });

  it("sends the week ended sms", async () => {
    prepareWeekEnded();
    await sendWeekEndedSMS(SMS_USER, 5);

    expect(record()).toMatchSnapshot();
  });

  it("sends the week ended sms for a visitor win", async () => {
    prepareWeekEnded(VISITOR_WON, { ...VISITOR, ...VISITOR_WON });
    await sendWeekEndedSMS(SMS_USER, 5);

    expect(record()).toMatchSnapshot();
  });

  it("sends the week ended sms for a tie", async () => {
    prepareWeekEnded(TIE);
    await sendWeekEndedSMS(SMS_USER, 5);

    expect(record()).toMatchSnapshot();
  });

  it("logs instead of sending the week ended sms without a phone number", async () => {
    prepareWeekEnded();
    await sendWeekEndedSMS(NO_PHONE_USER, 5);

    expect(record()).toMatchSnapshot();
  });

  it("logs instead of throwing when the week ended sms fails", async () => {
    prepareWeekEnded();
    sendSMS.mockRejectedValueOnce(new Error("Twilio down"));
    await sendWeekEndedSMS(SMS_USER, 5);

    expect(record()).toMatchSnapshot();
  });

  it("sends the week started sms", async () => {
    prepareWeekStarted();
    await sendWeekStartedSMS(SMS_USER, 5);

    expect(record()).toMatchSnapshot();
  });

  it("logs instead of sending the week started sms without a phone number", async () => {
    prepareWeekStarted();
    await sendWeekStartedSMS(NO_PHONE_USER, 5);

    expect(record()).toMatchSnapshot();
  });

  it("logs instead of throwing when the week started sms fails", async () => {
    prepareWeekStarted();
    sendSMS.mockRejectedValueOnce(new Error("Twilio down"));
    await sendWeekStartedSMS(SMS_USER, 5);

    expect(record()).toMatchSnapshot();
  });

  it.each([
    ["pick", sendPickReminderSMS],
    ["survivor", sendSurvivorReminderSMS],
  ])("sends the %s reminder sms", async (_name, send) => {
    await send(SMS_USER, 5, 3);

    expect(record()).toMatchSnapshot();
  });

  it.each([
    ["pick", sendPickReminderSMS],
    ["survivor", sendSurvivorReminderSMS],
  ])("logs instead of sending the %s reminder sms without a phone number", async (_name, send) => {
    await send(NO_PHONE_USER, 5, 3);

    expect(record()).toMatchSnapshot();
  });

  it.each([
    ["pick", sendPickReminderSMS],
    ["survivor", sendSurvivorReminderSMS],
  ])("logs instead of throwing when the %s reminder sms fails", async (_name, send) => {
    sendSMS.mockRejectedValueOnce(new Error("Twilio down"));
    await send(SMS_USER, 5, 3);

    expect(record()).toMatchSnapshot();
  });

  it.each([
    ["pick", sendPickReminderPushNotification],
    ["survivor", sendSurvivorReminderPushNotification],
  ])("sends the %s reminder push notification", async (_name, send) => {
    await send(PUSH_USER, 5, 3);

    expect(record()).toMatchSnapshot();
  });
});

describe("email template preview props", () => {
  it("keeps the preview props the react-email dev server renders", () => {
    expect({
      pickReminder: PickReminderEmail.PreviewProps,
      survivorReminder: SurvivorReminderEmail.PreviewProps,
      weekEnded: WeekEndedEmail.PreviewProps,
      weekStarted: WeekStartedEmail.PreviewProps,
    }).toMatchSnapshot();
  });
});
