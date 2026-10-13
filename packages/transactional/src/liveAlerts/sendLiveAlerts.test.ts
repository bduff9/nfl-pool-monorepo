import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LiveAlert } from "./types";

let mockDb: MockDb;

const sendPushNotification = vi.fn();

vi.mock("@nfl-pool-monorepo/db/src/kysely", () => ({
  get db() {
    return mockDb;
  },
}));
vi.mock("../../pushNotifications", () => ({ sendPushNotification }));

const alert = (overrides: Partial<LiveAlert> = {}): LiveAlert => ({
  body: "BUF won 27–20. You survive week 5!",
  key: "401872994",
  path: "/scoreboard/game/401872994",
  title: "Survivor Pool",
  type: "survivorResult",
  userId: 1,
  ...overrides,
});

const duplicateEntry = Object.assign(new Error("Duplicate entry"), { code: "ER_DUP_ENTRY", errno: 1062 });

describe("getAlertId", () => {
  it("is a stable 36 character UUID-shaped id that differs by type, key and user", async () => {
    const { getAlertId } = await import("./sendLiveAlerts");

    expect(getAlertId(alert())).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(getAlertId(alert())).toHaveLength(36);
    expect(getAlertId(alert())).toBe(getAlertId(alert()));
    expect(getAlertId(alert({ userId: 2 }))).not.toBe(getAlertId(alert()));
    expect(getAlertId(alert({ key: "other" }))).not.toBe(getAlertId(alert()));
    expect(getAlertId(alert({ type: "pointsEarned" }))).not.toBe(getAlertId(alert()));
  });
});

describe("sendLiveAlerts", () => {
  beforeEach(() => {
    mockDb = createMockDb();
    sendPushNotification.mockReset().mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("records the alert in the Emails log before sending the push", async () => {
    const order: string[] = [];

    mockDb.executeTakeFirstOrThrow.mockImplementation(() => {
      order.push("claim");

      return Promise.resolve({});
    });
    sendPushNotification.mockImplementation(() => {
      order.push("send");

      return Promise.resolve();
    });

    const { getAlertId, sendLiveAlerts } = await import("./sendLiveAlerts");
    const result = await sendLiveAlerts([alert()]);

    expect(result).toEqual({ failed: 0, sent: 1, skipped: 0 });
    expect(order).toEqual(["claim", "send"]);
    expect(mockDb.insertInto).toHaveBeenCalledWith("Emails");
    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({ EmailID: getAlertId(alert()), EmailTo: "1", EmailType: "liveGameAlert" }),
    );
    expect(sendPushNotification).toHaveBeenCalledWith(
      1,
      "Survivor Pool",
      "BUF won 27–20. You survive week 5!",
      "liveGameAlert",
      "/scoreboard/game/401872994",
    );
  });

  it("does not send an alert that was already recorded", async () => {
    mockDb.executeTakeFirstOrThrow.mockRejectedValue(duplicateEntry);

    const { sendLiveAlerts } = await import("./sendLiveAlerts");
    const result = await sendLiveAlerts([alert(), alert({ userId: 2 })]);

    expect(result).toEqual({ failed: 0, sent: 0, skipped: 2 });
    expect(sendPushNotification).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it("does not send, and reports a failure, when the log cannot be written for any other reason", async () => {
    mockDb.executeTakeFirstOrThrow.mockRejectedValue(new Error("connection lost"));

    const { sendLiveAlerts } = await import("./sendLiveAlerts");
    const result = await sendLiveAlerts([alert()]);

    expect(result).toEqual({ failed: 1, sent: 0, skipped: 0 });
    expect(sendPushNotification).not.toHaveBeenCalled();
  });

  it("keeps going after one alert fails and handles more alerts than one batch", async () => {
    mockDb.executeTakeFirstOrThrow.mockRejectedValueOnce(new Error("boom")).mockResolvedValue({});

    const { sendLiveAlerts } = await import("./sendLiveAlerts");
    const alerts = Array.from({ length: 25 }, (_, index) => alert({ userId: index + 1 }));
    const result = await sendLiveAlerts(alerts);

    expect(result).toEqual({ failed: 1, sent: 24, skipped: 0 });
    expect(await sendLiveAlerts([])).toEqual({ failed: 0, sent: 0, skipped: 0 });
  });
});
