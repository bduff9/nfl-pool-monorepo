import { db } from "@nfl-pool-monorepo/db/src/kysely";
import "server-only";

import { getBaseEmailClass, getBrowserLink, getUnsubscribeLink, sendEmail, updateEmailClass } from ".";
import { getHtml, getPlainText, getSubject } from "./templates/QuickPickConfirmationEmail";

export const sendQuickPickConfirmationEmail = async (
  userId: number,
  teamId: number,
  point: number,
  week: number,
): Promise<void> => {
  const user = await db.selectFrom('Users').select(['UserEmail', 'UserFirstName']).where('UserID', '=', userId).executeTakeFirstOrThrow();
  const game = await db.selectFrom('Games').select(['HomeTeamID', 'VisitorTeamID']).where('GameWeek', '=', week).where('GameNumber', '=', 1).executeTakeFirstOrThrow();
  const [selectedTeamId, notSelectedTeamId] = teamId === game.HomeTeamID ? [game.HomeTeamID, game.VisitorTeamID] : [game.VisitorTeamID, game.HomeTeamID];
  const selectedTeam = await db.selectFrom('Teams as t').select(['t.TeamCity', 't.TeamName', 't.TeamPrimaryColor']).where('t.TeamID', '=', selectedTeamId).executeTakeFirstOrThrow();
  const notSelectedTeam = await db.selectFrom('Teams as t').select(['t.TeamCity', 't.TeamName', 't.TeamPrimaryColor']).where('t.TeamID', '=', notSelectedTeamId).executeTakeFirstOrThrow();
  const to = [user.UserEmail];
  const emailId = await getBaseEmailClass({ to, type: "quickPickConfirmation" });
  const browserLink = getBrowserLink(emailId);
  const unsubscribeLink = getUnsubscribeLink(to);
  const subject = getSubject(week);
  const html = await getHtml({
    browserLink,
    notSelectedTeam,
    point,
    selectedTeam,
    unsubscribeLink,
    userFirstName: user.UserFirstName ?? 'player',
    week,
  });
  const text = await getPlainText({
    browserLink,
    notSelectedTeam,
    point,
    selectedTeam,
    unsubscribeLink,
    userFirstName: user.UserFirstName ?? 'player',
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
    console.error("Failed to send quick pick confirmation email: ", {
      error,
      props: {
        browserLink,
        notSelectedTeam,
        point,
        selectedTeam,
        unsubscribeLink,
        userFirstName: user.UserFirstName ?? 'player',
        week,
      },
      to,
      type: "quickPickConfirmation",
    });
  }

  await updateEmailClass({
    emailId,
    html,
    subject,
    text,
  });
};
