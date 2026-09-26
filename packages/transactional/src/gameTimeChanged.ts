import type { KickoffChange } from "@nfl-pool-monorepo/api/src/healing";
import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { MILLISECONDS_IN_SECOND, SECONDS_IN_MINUTE } from "@nfl-pool-monorepo/utils/constants";

import { sendGameTimeChangedEmail } from "../emails/gameTimeChanged";
import sendGameTimeChangedPushNotification from "../pushNotifications/gameTimeChanged";
import sendGameTimeChangedSMS from "../sms/gameTimeChanged";

export type GameTimeChangedInfo = {
  homeTeamName: string;
  newKickoffLabel: string;
  oldKickoffLabel: string;
  visitorTeamName: string;
  week: number;
};

// The NFL API drifts kickoff times by a few minutes for data hygiene reasons; only surface
// moves big enough to actually matter to someone planning their Sunday around a game.
const MIN_GAME_TIME_CHANGED_MINUTES = 60;

const kickoffFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/New_York",
});

export const sendGameTimeChangedNotifications = async (changes: Array<KickoffChange>): Promise<void> => {
  const relevantChanges = changes.filter(
    ({ newKickoff, oldKickoff }) =>
      Math.abs(newKickoff.getTime() - oldKickoff.getTime()) >=
      MIN_GAME_TIME_CHANGED_MINUTES * SECONDS_IN_MINUTE * MILLISECONDS_IN_SECOND,
  );

  if (relevantChanges.length === 0) {
    return;
  }

  console.log("Found game time changes to send notifications for", { count: relevantChanges.length });

  for (const change of relevantChanges) {
    await sendGameTimeChangeForGame(change);
  }
};

// fallow-ignore-next-line complexity -- CRAP is estimated without coverage data; exercised via sendGameTimeChangedNotifications in gameTimeChanged.test.ts
const sendGameTimeChangeForGame = async ({ gameID, newKickoff, oldKickoff, week }: KickoffChange): Promise<void> => {
  try {
    const game = await db
      .selectFrom("Games as g")
      .innerJoin("Teams as ht", "ht.TeamID", "g.HomeTeamID")
      .innerJoin("Teams as vt", "vt.TeamID", "g.VisitorTeamID")
      .select([
        "ht.TeamCity as homeTeamCity",
        "ht.TeamName as homeTeamName",
        "vt.TeamCity as visitorTeamCity",
        "vt.TeamName as visitorTeamName",
      ])
      .where("g.GameID", "=", gameID)
      .executeTakeFirst();

    if (!game?.homeTeamName || !game.visitorTeamName) {
      console.error("Skipping game time change notification, could not load team names", { game, gameID, week });

      return;
    }

    const info: GameTimeChangedInfo = {
      homeTeamName: `${game.homeTeamCity} ${game.homeTeamName}`,
      newKickoffLabel: `${kickoffFormatter.format(newKickoff)} ET`,
      oldKickoffLabel: `${kickoffFormatter.format(oldKickoff)} ET`,
      visitorTeamName: `${game.visitorTeamCity} ${game.visitorTeamName}`,
      week,
    };

    const users = await db
      .selectFrom("Picks as p")
      .innerJoin("Users as u", "u.UserID", "p.UserID")
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
      .where("p.GameID", "=", gameID)
      .where("p.PickDeleted", "is", null)
      .where("n.NotificationType", "=", "GameTimeChanged")
      .where("u.UserCommunicationsOptedOut", "=", 0)
      .where("u.UserDoneRegistering", "=", 1)
      .execute();

    console.log("Found game time change notifications to send", { count: users.length, gameID, week });

    for (const { NotificationEmail, NotificationPushNotification, NotificationSMS, ...user } of users) {
      try {
        await Promise.all([
          NotificationEmail === 1 ? sendGameTimeChangedEmail(user, info) : null,
          NotificationSMS === 1 ? sendGameTimeChangedSMS(user, info) : null,
          NotificationPushNotification === 1 ? sendGameTimeChangedPushNotification(user, info) : null,
        ]);
      } catch (error) {
        console.error(`Error sending game time change notifications to ${user.UserEmail}`, error);
      }
    }
  } catch (error) {
    console.error("Failed to send game time change notifications for game", { error, gameID, week });
  }
};
