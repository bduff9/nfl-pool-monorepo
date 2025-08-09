/*******************************************************************************
 * NFL Confidence Pool BE - the backend implementation of an NFL confidence pool.
 * Copyright (C) 2015-present Brian Duffey
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see {http://www.gnu.org/licenses/}.
 * Home: https://asitewithnoname.com/
 */
import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { hasUserPickedFirstGameForWeek } from "@nfl-pool-monorepo/db/src/queries/pick";
import { hasUserSubmittedSurvivorPickForWeek } from "@nfl-pool-monorepo/db/src/queries/survivor";
import { hasUserSubmittedPicksForWeek } from "@nfl-pool-monorepo/db/src/queries/tiebreaker";

import { sendPickReminderEmail } from "../emails/pickReminder";
import { sendQuickPickEmail } from "../emails/quickPick";
import { sendSurvivorReminderEmail } from "../emails/survivorReminder";
import sendPickReminderPushNotification from "../pushNotifications/pickReminder";
import sendSurvivorReminderPushNotification from "../pushNotifications/survivorReminder";
import sendPickReminderSMS from "../sms/pickReminder";
import sendSurvivorReminderSMS from "../sms/survivorReminder";

export const sendReminderEmails = async (hoursLeft: number, week: number): Promise<void> => {
  const notifications = await db
    .selectFrom("Notifications as n")
    .innerJoin("Users as u", "n.UserID", "u.UserID")
    .select(["n.NotificationType", "u.UserID", "u.UserEmail", "u.UserFirstName"])
    .where("u.UserCommunicationsOptedOut", "=", 0)
    .where("u.UserDoneRegistering", "=", 1)
    .where("n.NotificationEmail", "=", 1)
    .where("n.NotificationEmailHoursBefore", "=", hoursLeft)
    .execute();

  console.log("Found reminder emails to send", {
    count: notifications.length,
    hoursLeft,
    week,
  });

  for (const { NotificationType, UserID, UserEmail, UserFirstName } of notifications) {
    let hasUserSubmittedForWeek: boolean;

    switch (NotificationType) {
      case "PickReminder":
        hasUserSubmittedForWeek = await hasUserSubmittedPicksForWeek(UserID, week);

        if (!hasUserSubmittedForWeek) {
          await sendPickReminderEmail({ UserEmail, UserFirstName }, week, hoursLeft);
        }

        break;
      case "SurvivorReminder":
        hasUserSubmittedForWeek = await hasUserSubmittedSurvivorPickForWeek(UserID, week);

        if (!hasUserSubmittedForWeek) {
          await sendSurvivorReminderEmail({ UserEmail, UserFirstName }, week, hoursLeft);
        }

        break;
      case "QuickPick":
        hasUserSubmittedForWeek = await hasUserPickedFirstGameForWeek(UserID, week);

        if (!hasUserSubmittedForWeek) {
          await sendQuickPickEmail({ UserEmail, UserFirstName, UserID }, week, hoursLeft);
        }

        break;
      default:
        console.error("Invalid reminder email notification type found", {
          hoursLeft,
          NotificationType,
          UserEmail,
          UserFirstName,
          UserID,
          week,
        });
        break;
    }
  }
};

export const sendReminderPushNotifications = async (hoursLeft: number, week: number): Promise<void> => {
  const notifications = await db
    .selectFrom("Notifications as n")
    .innerJoin("Users as u", "n.UserID", "u.UserID")
    .select(["n.NotificationType", "u.UserID", "u.UserFirstName"])
    .where("u.UserCommunicationsOptedOut", "=", 0)
    .where("u.UserDoneRegistering", "=", 1)
    .where("n.NotificationPushNotification", "=", 1)
    .where("n.NotificationPushNotificationHoursBefore", "=", hoursLeft)
    .execute();

  console.log("Found reminder push notifications to send", {
    count: notifications.length,
    hoursLeft,
    week,
  });

  for (const { NotificationType, UserID, UserFirstName } of notifications) {
    switch (NotificationType) {
      case "PickReminder":
        await sendPickReminderPushNotification({ UserFirstName, UserID }, week, hoursLeft);
        break;
      case "SurvivorReminder":
        await sendSurvivorReminderPushNotification({ UserFirstName, UserID }, week, hoursLeft);
        break;
      default:
        console.error("Invalid reminder push notifications notification type found", {
          hoursLeft,
          NotificationType,
          UserFirstName,
          UserID,
          week,
        });
        break;
    }
  }
};

export const sendReminderTexts = async (hoursLeft: number, week: number): Promise<void> => {
  const notifications = await db
    .selectFrom("Notifications as n")
    .innerJoin("Users as u", "n.UserID", "u.UserID")
    .select(["n.NotificationType", "u.UserID", "u.UserFirstName", "u.UserPhone"])
    .where("u.UserCommunicationsOptedOut", "=", 0)
    .where("u.UserDoneRegistering", "=", 1)
    .where("n.NotificationSMS", "=", 1)
    .where("n.NotificationSMSHoursBefore", "=", hoursLeft)
    .execute();

  console.log("Found reminder SMS to send", {
    count: notifications.length,
    hoursLeft,
    week,
  });

  for (const { NotificationType, UserID, UserFirstName, UserPhone } of notifications) {
    let hasUserSubmittedForWeek: boolean;

    switch (NotificationType) {
      case "PickReminder":
        hasUserSubmittedForWeek = await hasUserSubmittedPicksForWeek(UserID, week);

        if (!hasUserSubmittedForWeek) {
          await sendPickReminderSMS({ UserFirstName, UserPhone }, week, hoursLeft);
        }

        break;
      case "SurvivorReminder":
        hasUserSubmittedForWeek = await hasUserSubmittedSurvivorPickForWeek(UserID, week);

        if (!hasUserSubmittedForWeek) {
          await sendSurvivorReminderSMS({ UserFirstName, UserPhone }, week, hoursLeft);
        }

        break;
      default:
        console.error("Invalid reminder SMS notification type found", {
          hoursLeft,
          NotificationType,
          UserFirstName,
          UserID,
          week,
        });
        break;
    }
  }
};
