import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockDb: MockDb;

const sendNotification = vi.fn();

class WebPushError extends Error {
  statusCode: number;

  constructor(statusCode: number) {
    super("Received unexpected response code");
    this.statusCode = statusCode;
  }
}

vi.mock("@nfl-pool-monorepo/db/src/kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("web-push", () => ({
  default: { sendNotification, setVapidDetails: vi.fn(), WebPushError },
}));

describe("sendPushNotification", () => {
  beforeEach(() => {
    mockDb = createMockDb();
    sendNotification.mockReset();
    vi.resetModules();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  it("deletes a subscription the push service reports as gone", async () => {
    mockDb.execute.mockResolvedValueOnce([{ DeviceID: 5, DeviceSub: "{}" }]).mockResolvedValueOnce(undefined);
    sendNotification.mockRejectedValueOnce(new WebPushError(410));

    const { sendPushNotification } = await import("../pushNotifications");
    await sendPushNotification(1, "Title", "Body", "weekStarted", "/weekly?week=3");

    expect(mockDb.deleteFrom).toHaveBeenCalledWith("Devices");
    expect(mockDb.where).toHaveBeenCalledWith("DeviceID", "=", 5);
    expect(console.error).not.toHaveBeenCalled();
  });

  it("keeps the subscription on other failures", async () => {
    mockDb.execute.mockResolvedValueOnce([{ DeviceID: 5, DeviceSub: "{}" }]);
    sendNotification.mockRejectedValueOnce(new WebPushError(500));

    const { sendPushNotification } = await import("../pushNotifications");
    await sendPushNotification(1, "Title", "Body", "weekStarted", "/weekly?week=3");

    expect(mockDb.deleteFrom).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it("sends the destination path as url so tapping the notification deep links", async () => {
    mockDb.execute.mockResolvedValueOnce([{ DeviceID: 5, DeviceSub: '{"endpoint":"https://push.example"}' }]);
    sendNotification.mockResolvedValueOnce(undefined);

    const { sendPushNotification } = await import("../pushNotifications");
    await sendPushNotification(1, "Title", "Body", "pickReminder", "/picks/set?week=3");

    expect(JSON.parse(sendNotification.mock.calls[0]?.[1] as string)).toEqual({
      body: "Body",
      title: "Title",
      url: "/picks/set?week=3",
    });
  });

  it("includes a badge count only when one is given", async () => {
    mockDb.execute
      .mockResolvedValueOnce([{ DeviceID: 5, DeviceSub: "{}" }])
      .mockResolvedValueOnce([{ DeviceID: 5, DeviceSub: "{}" }]);
    sendNotification.mockResolvedValue(undefined);

    const { sendPushNotification } = await import("../pushNotifications");
    await sendPushNotification(1, "Title", "Body", "pickReminder", "/picks/set?week=3", 1);
    await sendPushNotification(1, "Title", "Body", "weekStarted", "/weekly?week=3");

    expect(JSON.parse(sendNotification.mock.calls[0]?.[1] as string)).toMatchObject({ badge: 1 });
    expect(JSON.parse(sendNotification.mock.calls[1]?.[1] as string)).not.toHaveProperty("badge");
  });
});
