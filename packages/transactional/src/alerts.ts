import { db } from "@nfl-pool-monorepo/db/src/kysely";

import { sendWeekEndedEmail } from "../emails/weekEnded";
import { sendWeeklyEmail } from "../emails/weekly";
import { sendWeekStartedEmail } from "../emails/weekStarted";
import sendWeekEndedPushNotification from "../pushNotifications/weekEnded";
import sendWeekStartedPushNotification from "../pushNotifications/weekStarted";
import sendWeekEndedSMS from "../sms/weekEnded";
import sendWeekStartedSMS from "../sms/weekStarted";

export const sendWeekEndedNotifications = async (week: number): Promise<void> => {
  const notifications = await db
    .selectFrom("Notifications as n")
    .innerJoin("Users as u", "n.UserID", "u.UserID")
    .select([
      "n.NotificationEmail",
      "n.NotificationSMS",
      "n.NotificationPushNotification",
      "u.UserID",
      "u.UserEmail",
      "u.UserFirstName",
      "u.UserPhone",
    ])
    .where("u.UserCommunicationsOptedOut", "=", 0)
    .where("u.UserDoneRegistering", "=", 1)
    .where("n.NotificationType", "=", "WeekEnded")
    .where((eb) => eb.or([eb("n.NotificationEmail", "=", 1), eb("n.NotificationSMS", "=", 1)]))
    .execute();

  console.log("Found week ended notifications to send", {
    count: notifications.length,
    week,
  });

  for (const { NotificationEmail, NotificationPushNotification, NotificationSMS, ...user } of notifications) {
    try {
      await Promise.all([
        NotificationEmail === 1 ? sendWeekEndedEmail(user, week) : null,
        NotificationSMS === 1 ? sendWeekEndedSMS(user, week) : null,
        NotificationPushNotification === 1 ? sendWeekEndedPushNotification(user, week) : null,
      ]);
    } catch (error) {
      console.error(`Error sending week ended notifications to ${user.UserEmail}`, error);
    }
  }
};

export const sendWeekStartedNotifications = async (week: number): Promise<void> => {
  const notifications = await db
    .selectFrom("Notifications as n")
    .innerJoin("Users as u", "n.UserID", "u.UserID")
    .select([
      "n.NotificationEmail",
      "n.NotificationSMS",
      "n.NotificationPushNotification",
      "u.UserID",
      "u.UserEmail",
      "u.UserFirstName",
      "u.UserPhone",
    ])
    .where("u.UserCommunicationsOptedOut", "=", 0)
    .where("u.UserDoneRegistering", "=", 1)
    .where("n.NotificationType", "=", "WeekStarted")
    .where((eb) => eb.or([eb("n.NotificationEmail", "=", 1), eb("n.NotificationSMS", "=", 1)]))
    .execute();

  console.log("Found week started notifications to send", {
    count: notifications.length,
    week,
  });

  for (const { NotificationEmail, NotificationPushNotification, NotificationSMS, ...user } of notifications) {
    try {
      await Promise.all([
        NotificationEmail === 1 ? sendWeekStartedEmail(user, week) : null,
        NotificationSMS === 1 ? sendWeekStartedSMS(user, week) : null,
        NotificationPushNotification === 1 ? sendWeekStartedPushNotification(user, week) : null,
      ]);
    } catch (error) {
      console.error(`Error sending week started notifications to ${user.UserEmail}`, error);
    }
  }
};

export const sendWeeklyEmails = async (week: number): Promise<void> => {
  const emails = await db
    .selectFrom("Notifications as n")
    .innerJoin("Users as u", "n.UserID", "u.UserID")
    .select(["u.UserID", "u.UserEmail", "u.UserFirstName"])
    .where("u.UserCommunicationsOptedOut", "=", 0)
    .where("u.UserDoneRegistering", "=", 1)
    .where("n.NotificationType", "=", "Essentials")
    .execute();

  for (const user of emails) {
    try {
      await sendWeeklyEmail(user, week);
    } catch (error) {
      console.error(`Error sending weekly email to ${user.UserEmail}`, error);
    }
  }
};
