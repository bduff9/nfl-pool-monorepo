import type { DB } from "@nfl-pool-monorepo/db/src";
import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import type { Transaction } from "kysely";
import { beforeEach, describe, expect, it } from "vitest";

describe("updateUserNotifications", () => {
  let mockDb: MockDb;

  beforeEach(() => {
    mockDb = createMockDb();
  });

  it("seeds any missing notification rows and enables essential email notifications", async () => {
    mockDb.executeTakeFirstOrThrow.mockResolvedValue({});

    const { updateUserNotifications } = await import("./notification");

    await updateUserNotifications(mockDb as unknown as Transaction<DB>, { UserEmail: "user@example.com", UserID: 1 });

    expect(mockDb.insertInto).toHaveBeenCalledWith("Notifications");
    expect(mockDb.updateTable).toHaveBeenCalledWith("Notifications");
    expect(mockDb.set).toHaveBeenCalledWith(
      expect.objectContaining({ NotificationEmail: 1, NotificationUpdatedBy: "user@example.com" }),
    );
    expect(mockDb.where).toHaveBeenCalledWith("NotificationType", "=", "Essentials");
  });

  it("turns live game alert push notifications on by default for the new user", async () => {
    mockDb.executeTakeFirstOrThrow.mockResolvedValue({});

    const { updateUserNotifications } = await import("./notification");

    await updateUserNotifications(mockDb as unknown as Transaction<DB>, { UserEmail: "user@example.com", UserID: 7 });

    expect(mockDb.set).toHaveBeenCalledWith({
      NotificationPushNotification: 1,
      NotificationUpdatedBy: "user@example.com",
    });
    expect(mockDb.where).toHaveBeenCalledWith("NotificationType", "=", "LiveGameAlerts");
    expect(mockDb.where).toHaveBeenCalledWith("UserID", "=", 7);
  });
});
