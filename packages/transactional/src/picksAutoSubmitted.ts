import { db } from "@nfl-pool-monorepo/db/src/kysely";

import { sendPicksAutoSubmittedEmail } from "../emails/picksAutoSubmitted";
import sendPicksAutoSubmittedPushNotification from "../pushNotifications/picksAutoSubmitted";
import sendPicksAutoSubmittedSMS from "../sms/picksAutoSubmitted";

export type PicksAutoSubmittedInfo = {
  homeTeamName: string;
  // Set when the user's auto-pick strategy chose a team; otherwise only points were assigned.
  pickedTeamName?: string;
  pickPoints: number;
  visitorTeamName: string;
  week: number;
};

export type AutoSubmittedPick = {
  gameID: number;
  pickPoints: number;
  userID: number;
};

export const sendPicksAutoSubmittedNotifications = async (
  week: number,
  picks: Array<AutoSubmittedPick>,
): Promise<void> => {
  if (picks.length === 0) {
    return;
  }

  console.log("Found auto submitted pick notifications to send", { count: picks.length, week });

  for (const pick of picks) {
    await sendPicksAutoSubmittedForPick(week, pick);
  }
};

const sendPicksAutoSubmittedForPick = async (
  week: number,
  { gameID, pickPoints, userID }: AutoSubmittedPick,
): Promise<void> => {
  try {
    const game = await db
      .selectFrom("Games as g")
      .innerJoin("Teams as ht", "ht.TeamID", "g.HomeTeamID")
      .innerJoin("Teams as vt", "vt.TeamID", "g.VisitorTeamID")
      .innerJoin("Picks as p", "p.GameID", "g.GameID")
      .select([
        "ht.TeamCity as homeTeamCity",
        "ht.TeamName as homeTeamName",
        "vt.TeamCity as visitorTeamCity",
        "vt.TeamName as visitorTeamName",
        "p.TeamID as pickedTeamID",
      ])
      .where("g.GameID", "=", gameID)
      .where("p.UserID", "=", userID)
      .executeTakeFirst();

    if (!game) {
      console.error("Skipping auto submitted pick notification, could not load pick and game", {
        gameID,
        userID,
        week,
      });

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
      .where("u.UserID", "=", userID)
      .where("n.NotificationType", "=", "PicksSubmitted")
      .where("u.UserCommunicationsOptedOut", "=", 0)
      .where("u.UserDoneRegistering", "=", 1)
      .executeTakeFirst();

    if (!users) {
      return;
    }

    const pickedTeamName = game.pickedTeamID
      ? await db
          .selectFrom("Teams as t")
          .select(["t.TeamCity", "t.TeamName"])
          .where("t.TeamID", "=", game.pickedTeamID)
          .executeTakeFirst()
          .then((team) => (team ? `${team.TeamCity} ${team.TeamName}` : undefined))
      : undefined;

    const info: PicksAutoSubmittedInfo = {
      homeTeamName: `${game.homeTeamCity} ${game.homeTeamName}`,
      pickPoints,
      visitorTeamName: `${game.visitorTeamCity} ${game.visitorTeamName}`,
      week,
      ...(pickedTeamName !== undefined ? { pickedTeamName } : {}),
    };

    const { NotificationEmail, NotificationPushNotification, NotificationSMS, ...user } = users;

    await Promise.all([
      NotificationEmail === 1 ? sendPicksAutoSubmittedEmail(user, info) : null,
      NotificationSMS === 1 ? sendPicksAutoSubmittedSMS(user, info) : null,
      NotificationPushNotification === 1 ? sendPicksAutoSubmittedPushNotification(user, info) : null,
    ]);
  } catch (error) {
    console.error("Failed to send auto submitted pick notification", { error, gameID, userID, week });
  }
};
