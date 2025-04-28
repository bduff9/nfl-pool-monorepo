import type { Users } from "@nfl-pool-monorepo/db/src";
import { db } from "@nfl-pool-monorepo/db/src/kysely";
import type { Selectable } from "kysely";
import "server-only";


import { getBaseEmailClass, getBrowserLink, getUnsubscribeLink, sendEmail, updateEmailClass } from ".";
import { getHtml, getPlainText, getSubject } from "./templates/QuickPickEmail";

export const sendQuickPickEmail = async (
  user: Pick<Selectable<Users>, "UserID" | "UserEmail" | "UserFirstName">,
  week: number,
  hoursLeft: number,
): Promise<void> => {
  const homeTeam = await db.selectFrom('Teams as t').select(['t.TeamID', 't.TeamCity', 't.TeamName', 't.TeamPrimaryColor', 't.TeamSecondaryColor']).innerJoin('Games as g', 'g.HomeTeamID', 't.TeamID').where('g.GameWeek', '=', week).where('g.GameNumber', '=', 1).executeTakeFirstOrThrow();
  const visitorTeam = await db.selectFrom('Teams as t').select(['t.TeamID', 't.TeamCity', 't.TeamName', 't.TeamPrimaryColor', 't.TeamSecondaryColor']).innerJoin('Games as g', 'g.VisitorTeamID', 't.TeamID').where('g.GameWeek', '=', week).where('g.GameNumber', '=', 1).executeTakeFirstOrThrow();
  const to = [user.UserEmail];
  const emailId = await getBaseEmailClass({ to, type: "quickPick" });
  const browserLink = getBrowserLink(emailId);
  const unsubscribeLink = getUnsubscribeLink(to);
  const subject = getSubject(user.UserFirstName ?? 'player');
  const html = await getHtml({
    browserLink,
    homeTeam,
    hoursLeft,
    unsubscribeLink,
    userFirstName: user.UserFirstName ?? 'player',
    userId: user.UserID,
    visitorTeam,
    week,
  });
  const text = await getPlainText({
    browserLink,
    homeTeam,
    hoursLeft,
    unsubscribeLink,
    userFirstName: user.UserFirstName ?? 'player',
    userId: user.UserID,
    visitorTeam,
    week,
  });

  try {
    await sendEmail({
      html,
      subject,
      text,
      to,
    });
  } catch (error) {
    console.error("Failed to send quick pick email: ", {
      error,
      props: {
        browserLink,
        homeTeam,
        hoursLeft,
        unsubscribeLink,
        userFirstName: user.UserFirstName ?? 'player',
        userId: user.UserID,
        visitorTeam,
        week,
      },
      to,
      type: "quickPick",
    });
  }

  await updateEmailClass({
    emailId,
    html,
    subject,
    text,
  });
};
