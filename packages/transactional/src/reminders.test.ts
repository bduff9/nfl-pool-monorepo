import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockDb: MockDb;

const hasUserPickedFirstGameForWeek = vi.fn();
const hasUserSubmittedPicksForWeek = vi.fn();
const hasUserSubmittedSurvivorPickForWeek = vi.fn();
const sendPickReminderEmail = vi.fn();
const sendQuickPickEmail = vi.fn();
const sendSurvivorReminderEmail = vi.fn();
const sendPickReminderPushNotification = vi.fn();
const sendSurvivorReminderPushNotification = vi.fn();
const sendPickReminderSMS = vi.fn();
const sendSurvivorReminderSMS = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("@nfl-pool-monorepo/db/src/queries/pick", () => ({ hasUserPickedFirstGameForWeek }));
vi.mock("@nfl-pool-monorepo/db/src/queries/survivor", () => ({ hasUserSubmittedSurvivorPickForWeek }));
vi.mock("@nfl-pool-monorepo/db/src/queries/tiebreaker", () => ({ hasUserSubmittedPicksForWeek }));
vi.mock("../emails/pickReminder", () => ({ sendPickReminderEmail }));
vi.mock("../emails/quickPick", () => ({ sendQuickPickEmail }));
vi.mock("../emails/survivorReminder", () => ({ sendSurvivorReminderEmail }));
vi.mock("../pushNotifications/pickReminder", () => ({ default: sendPickReminderPushNotification }));
vi.mock("../pushNotifications/survivorReminder", () => ({ default: sendSurvivorReminderPushNotification }));
vi.mock("../sms/pickReminder", () => ({ default: sendPickReminderSMS }));
vi.mock("../sms/survivorReminder", () => ({ default: sendSurvivorReminderSMS }));

const baseUser = {
  UserEmail: "user@example.com",
  UserFirstName: "Test",
  UserID: 1,
};

const resetAllMocks = () => {
  mockDb = createMockDb();
  hasUserPickedFirstGameForWeek.mockReset().mockResolvedValue(false);
  hasUserSubmittedPicksForWeek.mockReset().mockResolvedValue(false);
  hasUserSubmittedSurvivorPickForWeek.mockReset().mockResolvedValue(false);
  sendPickReminderEmail.mockReset().mockResolvedValue(undefined);
  sendQuickPickEmail.mockReset().mockResolvedValue(undefined);
  sendSurvivorReminderEmail.mockReset().mockResolvedValue(undefined);
  sendPickReminderPushNotification.mockReset().mockResolvedValue(undefined);
  sendSurvivorReminderPushNotification.mockReset().mockResolvedValue(undefined);
  sendPickReminderSMS.mockReset().mockResolvedValue(undefined);
  sendSurvivorReminderSMS.mockReset().mockResolvedValue(undefined);
  vi.resetModules();
};

describe("sendReminderEmails", () => {
  beforeEach(resetAllMocks);

  it("sends a pick reminder only when the user has not submitted picks", async () => {
    mockDb.execute.mockResolvedValueOnce([{ ...baseUser, NotificationType: "PickReminder" }]);
    hasUserSubmittedPicksForWeek.mockResolvedValueOnce(true);

    const { sendReminderEmails } = await import("./reminders");

    await sendReminderEmails(12, 5);
    expect(sendPickReminderEmail).not.toHaveBeenCalled();

    hasUserSubmittedPicksForWeek.mockResolvedValueOnce(false);
    mockDb.execute.mockResolvedValueOnce([{ ...baseUser, NotificationType: "PickReminder" }]);
    await sendReminderEmails(12, 5);

    expect(hasUserSubmittedPicksForWeek).toHaveBeenCalledWith(1, 5);
    expect(sendPickReminderEmail).toHaveBeenCalledWith({ UserEmail: "user@example.com", UserFirstName: "Test" }, 5, 12);
  });

  it("sends a survivor reminder only when the user has not made a survivor pick", async () => {
    mockDb.execute.mockResolvedValueOnce([{ ...baseUser, NotificationType: "SurvivorReminder" }]);

    const { sendReminderEmails } = await import("./reminders");

    await sendReminderEmails(12, 5);

    expect(hasUserSubmittedSurvivorPickForWeek).toHaveBeenCalledWith(1, 5);
    expect(sendSurvivorReminderEmail).toHaveBeenCalledTimes(1);
  });

  it("sends a quick pick email only when the first game has no pick", async () => {
    mockDb.execute.mockResolvedValueOnce([{ ...baseUser, NotificationType: "QuickPick" }]);
    hasUserPickedFirstGameForWeek.mockResolvedValueOnce(false);

    const { sendReminderEmails } = await import("./reminders");

    await sendReminderEmails(12, 5);

    expect(sendQuickPickEmail).toHaveBeenCalledTimes(1);
    expect(sendQuickPickEmail.mock.calls[0]?.[2]).toBe(12);
  });

  it("skips unknown notification types without throwing", async () => {
    mockDb.execute.mockResolvedValueOnce([{ ...baseUser, NotificationType: "Essentials" }]);

    const { sendReminderEmails } = await import("./reminders");

    await expect(sendReminderEmails(12, 5)).resolves.toBeUndefined();
    expect(sendPickReminderEmail).not.toHaveBeenCalled();
  });
});
