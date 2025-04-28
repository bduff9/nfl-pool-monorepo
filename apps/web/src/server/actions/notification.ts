import type { DB, Users } from "@nfl-pool-monorepo/db/src";
import type { Selectable, Transaction } from "kysely";

export const updateUserNotifications = async (
  trx: Transaction<DB>,
  user: Pick<Selectable<Users>, "UserID" | "UserEmail">,
) => {
  await trx
    .insertInto("Notifications")
    .columns(["UserID", "NotificationType", "NotificationAddedBy", "NotificationUpdatedBy"])
    .expression((eb) =>
      eb
        .selectFrom("NotificationTypes as nt")
        .select([
          eb.val(user.UserID).as("UserID"),
          "nt.NotificationType",
          eb.val(user.UserEmail).as("NotificationAddedBy"),
          eb.val(user.UserEmail).as("NotificationUpdatedBy"),
        ])
        .leftJoin("Notifications as n", (join) =>
          join.onRef("n.NotificationType", "=", "nt.NotificationType").on("n.UserID", "=", user.UserID),
        )
        .where("n.NotificationID", "is", null),
    )
    .executeTakeFirstOrThrow();
  await trx
    .updateTable("Notifications")
    .set({ NotificationEmail: 1, NotificationUpdatedBy: user.UserEmail })
    .where("NotificationType", "=", "Essentials")
    .where("UserID", "=", user.UserID)
    .executeTakeFirstOrThrow();
};
