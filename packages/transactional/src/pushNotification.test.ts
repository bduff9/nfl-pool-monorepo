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
vi.mock("./env", () => ({ env: { domain: "https://pool.test" } }));
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

  it("sends a declarative web push payload with an absolute navigate url", async () => {
    mockDb.execute.mockResolvedValueOnce([{ DeviceID: 5, DeviceSub: '{"endpoint":"https://push.example"}' }]);
    sendNotification.mockResolvedValueOnce(undefined);

    const { sendPushNotification } = await import("../pushNotifications");
    await sendPushNotification(1, "Title", "Body", "weekStarted", "/weekly?week=3");

    expect(JSON.parse(sendNotification.mock.calls[0]?.[1] as string)).toEqual({
      mutable: true,
      notification: { body: "Body", lang: "en", navigate: "https://pool.test/weekly?week=3", title: "Title" },
      web_push: 8030,
    });
  });

  it("includes the app badge and action buttons only when given", async () => {
    mockDb.execute
      .mockResolvedValueOnce([{ DeviceID: 5, DeviceSub: "{}" }])
      .mockResolvedValueOnce([{ DeviceID: 5, DeviceSub: "{}" }]);
    sendNotification.mockResolvedValue(undefined);

    const actions = [{ action: "make-picks", title: "Make picks", url: "/picks/set?week=3" }];
    const { sendPushNotification } = await import("../pushNotifications");
    await sendPushNotification(1, "Title", "Body", "pickReminder", "/picks/set?week=3", 1, actions);
    await sendPushNotification(1, "Title", "Body", "weekStarted", "/weekly?week=3");

    expect(JSON.parse(sendNotification.mock.calls[0]?.[1] as string)).toMatchObject({
      actions,
      notification: { app_badge: 1 },
    });

    const plain = JSON.parse(sendNotification.mock.calls[1]?.[1] as string);

    expect(plain).not.toHaveProperty("actions");
    expect(plain.notification).not.toHaveProperty("app_badge");
  });
});
