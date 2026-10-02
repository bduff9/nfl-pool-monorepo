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
    await sendPushNotification(1, "Title", "Body", "weekStarted");

    expect(mockDb.deleteFrom).toHaveBeenCalledWith("Devices");
    expect(mockDb.where).toHaveBeenCalledWith("DeviceID", "=", 5);
    expect(console.error).not.toHaveBeenCalled();
  });

  it("keeps the subscription on other failures", async () => {
    mockDb.execute.mockResolvedValueOnce([{ DeviceID: 5, DeviceSub: "{}" }]);
    sendNotification.mockRejectedValueOnce(new WebPushError(500));

    const { sendPushNotification } = await import("../pushNotifications");
    await sendPushNotification(1, "Title", "Body", "weekStarted");

    expect(mockDb.deleteFrom).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});
