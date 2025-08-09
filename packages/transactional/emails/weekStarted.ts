import type { Users } from "@nfl-pool-monorepo/db/src";
import { db } from "@nfl-pool-monorepo/db/src/kysely";
import type { Selectable } from "kysely";

import { getBaseEmailClass, getBrowserLink, getUnsubscribeLink, sendEmail, updateEmailClass } from ".";
import { getHtml, getPlainText, getSubject } from "./templates/WeekStartedEmail";

export const sendWeekStartedEmail = async (
  user: Pick<Selectable<Users>, "UserEmail" | "UserFirstName">,
  week: number,
): Promise<void> => {
  const homeTeam = await db
    .selectFrom("Teams as t")
    .select(["t.TeamCity", "t.TeamName", "t.TeamPrimaryColor", "t.TeamSecondaryColor"])
    .innerJoin("Games as g", "g.HomeTeamID", "t.TeamID")
    .where("g.GameWeek", "=", week)
    .where("g.GameNumber", "=", 1)
    .executeTakeFirstOrThrow();
  const visitorTeam = await db
    .selectFrom("Teams as t")
    .select(["t.TeamCity", "t.TeamName", "t.TeamPrimaryColor", "t.TeamSecondaryColor"])
    .innerJoin("Games as g", "g.VisitorTeamID", "t.TeamID")
    .where("g.GameWeek", "=", week)
    .where("g.GameNumber", "=", 1)
    .executeTakeFirstOrThrow();
  const to = [user.UserEmail];
  const emailId = await getBaseEmailClass({ to, type: "weekStarted" });
  const browserLink = getBrowserLink(emailId);
  const unsubscribeLink = getUnsubscribeLink(to);
  const subject = getSubject(week);
  const html = await getHtml({
    browserLink,
    homeTeam,
    unsubscribeLink,
    userFirstName: user.UserFirstName ?? "player",
    visitorTeam,
    week,
  });
  const text = await getPlainText({
    browserLink,
    homeTeam,
    unsubscribeLink,
    userFirstName: user.UserFirstName ?? "player",
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
    console.error("Failed to send week started email: ", {
      error,
      props: {
        browserLink,
        homeTeam,
        unsubscribeLink,
        userFirstName: user.UserFirstName ?? "player",
        visitorTeam,
        week,
      },
      to,
      type: "weekStarted",
    });
  }

  await updateEmailClass({
    emailId,
    html,
    subject,
    text,
  });
};
