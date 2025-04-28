import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { cache } from "react";

export const getUserNotifications = cache(async (userId: number) => {
  const notifications = await db
    .selectFrom("Notifications as n")
    .select([
      "n.NotificationID",
      "n.NotificationType",
      "n.NotificationEmail",
      "n.NotificationEmailHoursBefore",
      "n.NotificationSMS",
      "n.NotificationSMSHoursBefore",
      "n.NotificationPushNotification",
      "n.NotificationPushNotificationHoursBefore",
    ])
    .innerJoin("NotificationTypes as nt", "n.NotificationType", "nt.NotificationType")
    .select([
      'nt.NotificationTypeDescription',
      'nt.NotificationTypeHasEmail',
      'nt.NotificationTypeHasHours',
      'nt.NotificationTypeHasPushNotification',
      'nt.NotificationTypeHasSMS',
      'nt.NotificationTypeTooltip',
    ])
    .where("n.UserID", "=", userId)
    .execute();

  return notifications;
});
