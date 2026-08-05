import { createMockDb, type MockDb } from "@nfl-pool-monorepo/db/src/test-utils/mockDb";
import { beforeEach, describe, expect, it } from "vitest";

describe("updateUserNotifications", () => {
  let mockDb: MockDb;

  beforeEach(() => {
    mockDb = createMockDb();
  });

  it("seeds any missing notification rows and enables essential email notifications", async () => {
    mockDb.executeTakeFirstOrThrow.mockResolvedValue({});

    const { updateUserNotifications } = await import("./notification");

    await updateUserNotifications(mockDb, { UserEmail: "user@example.com", UserID: 1 });

    expect(mockDb.insertInto).toHaveBeenCalledWith("Notifications");
    expect(mockDb.updateTable).toHaveBeenCalledWith("Notifications");
    expect(mockDb.set).toHaveBeenCalledWith(
      expect.objectContaining({ NotificationEmail: 1, NotificationUpdatedBy: "user@example.com" }),
    );
    expect(mockDb.where).toHaveBeenCalledWith("NotificationType", "=", "Essentials");
  });
});
