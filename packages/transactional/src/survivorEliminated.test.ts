import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockDb: MockDb;

const sendSurvivorEliminatedEmail = vi.fn();
const sendSurvivorEliminatedPushNotification = vi.fn();
const sendSurvivorEliminatedSMS = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("../emails/survivorEliminated", () => ({ sendSurvivorEliminatedEmail }));
vi.mock("../pushNotifications/survivorEliminated", () => ({ default: sendSurvivorEliminatedPushNotification }));
vi.mock("../sms/survivorEliminated", () => ({ default: sendSurvivorEliminatedSMS }));

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
  sendSurvivorEliminatedEmail.mockReset().mockResolvedValue(undefined);
  sendSurvivorEliminatedPushNotification.mockReset().mockResolvedValue(undefined);
  sendSurvivorEliminatedSMS.mockReset().mockResolvedValue(undefined);
  vi.resetModules();
};

describe("sendSurvivorEliminatedNotifications", () => {
  beforeEach(resetAllMocks);

  it("does nothing when nobody was eliminated", async () => {
    const { sendSurvivorEliminatedNotifications } = await import("./survivorEliminated");

    await sendSurvivorEliminatedNotifications(5, []);

    expect(mockDb.selectFrom).not.toHaveBeenCalled();
  });

  it("names the losing pick when the user picked a team", async () => {
    mockDb.execute.mockResolvedValueOnce([USER]);
    mockDb.execute.mockResolvedValueOnce([{ TeamCity: "New England", TeamName: "Patriots", UserID: 1 }]);

    const { sendSurvivorEliminatedNotifications } = await import("./survivorEliminated");

    await sendSurvivorEliminatedNotifications(5, [1]);

    expect(sendSurvivorEliminatedEmail).toHaveBeenCalledTimes(1);
    const user = sendSurvivorEliminatedEmail.mock.calls[0]?.[0];
    const week = sendSurvivorEliminatedEmail.mock.calls[0]?.[1];
    const pickedTeamName = sendSurvivorEliminatedEmail.mock.calls[0]?.[2];
    expect(user?.UserEmail).toBe("user@example.com");
    expect(week).toBe(5);
    expect(pickedTeamName).toBe("New England Patriots");
  });

  it("uses the missed-week variant when the user has no pick for the week", async () => {
    mockDb.execute.mockResolvedValueOnce([USER]);
    mockDb.execute.mockResolvedValueOnce([]);

    const { sendSurvivorEliminatedNotifications } = await import("./survivorEliminated");

    await sendSurvivorEliminatedNotifications(5, [1]);

    expect(sendSurvivorEliminatedEmail).toHaveBeenCalledWith(expect.anything(), 5, undefined);
    expect(sendSurvivorEliminatedSMS).toHaveBeenCalledTimes(1);
  });
});
