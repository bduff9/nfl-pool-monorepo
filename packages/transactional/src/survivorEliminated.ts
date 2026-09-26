import { db } from "@nfl-pool-monorepo/db/src/kysely";

import { sendSurvivorEliminatedEmail } from "../emails/survivorEliminated";
import sendSurvivorEliminatedPushNotification from "../pushNotifications/survivorEliminated";
import sendSurvivorEliminatedSMS from "../sms/survivorEliminated";

export const sendSurvivorEliminatedNotifications = async (week: number, userIDs: Array<number>): Promise<void> => {
  if (userIDs.length === 0) {
    return;
  }

  const users = await db
    .selectFrom("Users as u")
    .innerJoin("Notifications as n", "n.UserID", "u.UserID")
    .select([
      "n.NotificationEmail",
      "n.NotificationPushNotification",
      "n.NotificationSMS",
      "u.UserID",
      "u.UserEmail",
      "u.UserFirstName",
      "u.UserPhone",
    ])
    .where("u.UserID", "in", userIDs)
    .where("n.NotificationType", "=", "SurvivorEliminated")
    .where("u.UserCommunicationsOptedOut", "=", 0)
    .where("u.UserDoneRegistering", "=", 1)
    .execute();

  console.log("Found survivor eliminated notifications to send", { count: users.length, week });

  // Resolve what each eliminated user actually picked so the message can say why they're
  // out; users without a pick for the week get the "missed the week" variant.
  const pickedTeams = await db
    .selectFrom("SurvivorPicks as sp")
    .innerJoin("Teams as t", "t.TeamID", "sp.TeamID")
    .select(["sp.UserID", "t.TeamCity", "t.TeamName"])
    .where("sp.SurvivorPickWeek", "=", week)
    .where("sp.SurvivorPickDeleted", "is", null)
    .where("sp.UserID", "in", userIDs)
    .execute();

  const pickedTeamNameByUserID = new Map(
    pickedTeams.map(({ TeamCity, TeamName, UserID }) => [UserID, `${TeamCity} ${TeamName}`]),
  );

  for (const { NotificationEmail, NotificationPushNotification, NotificationSMS, ...user } of users) {
    const pickedTeamName = pickedTeamNameByUserID.get(user.UserID);

    try {
      await Promise.all([
        NotificationEmail === 1 ? sendSurvivorEliminatedEmail(user, week, pickedTeamName) : null,
        NotificationSMS === 1 ? sendSurvivorEliminatedSMS(user, week, pickedTeamName) : null,
        NotificationPushNotification === 1 ? sendSurvivorEliminatedPushNotification(user, week, pickedTeamName) : null,
      ]);
    } catch (error) {
      console.error(`Error sending survivor eliminated notifications to ${user.UserEmail}`, error);
    }
  }
};
