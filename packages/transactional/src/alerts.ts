import { db } from "@nfl-pool-monorepo/db/src/kysely";
import type { NewsArticle } from "@nfl-pool-monorepo/utils/validation";

import { sendWeekEndedEmail } from "../emails/weekEnded";
import { sendWeeklyEmail } from "../emails/weekly";
import { sendWeekStartedEmail } from "../emails/weekStarted";
import sendWeekEndedPushNotification from "../pushNotifications/weekEnded";
import sendWeekStartedPushNotification from "../pushNotifications/weekStarted";
import sendWeekEndedSMS from "../sms/weekEnded";
import sendWeekStartedSMS from "../sms/weekStarted";
import { getWeekRecap, type WeekRecap } from "./recap";

type WeekNotificationType = "WeekEnded" | "WeekStarted";

const getWeekNotifications = (type: WeekNotificationType) =>
  db
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
    .where("n.NotificationType", "=", type)
    .where((eb) => eb.or([eb("n.NotificationEmail", "=", 1), eb("n.NotificationSMS", "=", 1)]))
    .execute();

type WeekNotificationRow = Awaited<ReturnType<typeof getWeekNotifications>>[number];
type WeekNotificationUser = Omit<
  WeekNotificationRow,
  "NotificationEmail" | "NotificationPushNotification" | "NotificationSMS"
>;

const sendWeekNotifications = async (
  type: WeekNotificationType,
  label: string,
  week: number,
  send: {
    email: (user: WeekNotificationUser, week: number) => Promise<void>;
    pushNotification: (user: WeekNotificationUser, week: number) => Promise<void>;
    sms: (user: WeekNotificationUser, week: number) => Promise<void>;
  },
): Promise<void> => {
  const notifications = await getWeekNotifications(type);

  console.log(`Found ${label} notifications to send`, {
    count: notifications.length,
    week,
  });

  for (const { NotificationEmail, NotificationPushNotification, NotificationSMS, ...user } of notifications) {
    try {
      await Promise.all([
        NotificationEmail === 1 ? send.email(user, week) : null,
        NotificationSMS === 1 ? send.sms(user, week) : null,
        NotificationPushNotification === 1 ? send.pushNotification(user, week) : null,
      ]);
    } catch (error) {
      console.error(`Error sending ${label} notifications to ${user.UserEmail}`, error);
    }
  }
};

export const sendWeekEndedNotifications = (week: number): Promise<void> =>
  sendWeekNotifications("WeekEnded", "week ended", week, {
    email: sendWeekEndedEmail,
    pushNotification: sendWeekEndedPushNotification,
    sms: sendWeekEndedSMS,
  });

export const sendWeekStartedNotifications = (week: number): Promise<void> =>
  sendWeekNotifications("WeekStarted", "week started", week, {
    email: sendWeekStartedEmail,
    pushNotification: sendWeekStartedPushNotification,
    sms: sendWeekStartedSMS,
  });

// The recap is a bonus section, so a failure reading it must not stop the weekly emails going out
const getWeekRecapOrNull = async (week: number): Promise<WeekRecap | null> => {
  try {
    return await getWeekRecap(week);
  } catch (error) {
    console.error(`Error reading the week ${week} recap`, error);

    return null;
  }
};

export const sendWeeklyEmails = async (week: number, articles: Array<NewsArticle>): Promise<void> => {
  const emails = await db
    .selectFrom("Notifications as n")
    .innerJoin("Users as u", "n.UserID", "u.UserID")
    .select(["u.UserID", "u.UserEmail", "u.UserFirstName"])
    .where("u.UserCommunicationsOptedOut", "=", 0)
    .where("u.UserDoneRegistering", "=", 1)
    .where("n.NotificationType", "=", "Essentials")
    .execute();

  // The recap is the same pool-wide data for every recipient, so read it once instead of per user
  const recap = await getWeekRecapOrNull(week);

  for (const user of emails) {
    try {
      // react-doctor-disable-next-line async-await-in-loop -- one email at a time keeps SES within its send rate, and each user is wrapped in try/catch so one failure cannot stop the rest
      await sendWeeklyEmail(user, week, articles, recap);
    } catch (error) {
      console.error(`Error sending weekly email to ${user.UserEmail}`, error);
    }
  }
};
