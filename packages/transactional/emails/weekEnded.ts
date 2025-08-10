import type { Users } from "@nfl-pool-monorepo/db/src";
import { db } from "@nfl-pool-monorepo/db/src/kysely";
import type { Selectable } from "kysely";

import { getBaseEmailClass, getBrowserLink, getUnsubscribeLink, sendEmail, updateEmailClass } from ".";
import { getHtml, getPlainText, getSubject } from "./templates/WeekEndedEmail";

export const sendWeekEndedEmail = async (
  user: Pick<Selectable<Users>, "UserEmail" | "UserFirstName">,
  week: number,
): Promise<void> => {
  const homeTeam = await db
    .selectFrom("Teams as t")
    .innerJoin("Games as g", "g.HomeTeamID", "t.TeamID")
    .select([
      "g.GameHomeScore",
      "g.GameVisitorScore",
      "t.TeamCity",
      "t.TeamName",
      "t.TeamPrimaryColor",
      "t.TeamSecondaryColor",
    ])
    .where("g.GameWeek", "=", week)
    .orderBy("GameKickoff", "desc")
    .executeTakeFirstOrThrow();
  const visitorTeam = await db
    .selectFrom("Teams as t")
    .select(["t.TeamCity", "t.TeamName", "t.TeamPrimaryColor", "t.TeamSecondaryColor"])
    .innerJoin("Games as g", "g.VisitorTeamID", "t.TeamID")
    .where("g.GameWeek", "=", week)
    .orderBy("GameKickoff", "desc")
    .executeTakeFirstOrThrow();
  const winnerTeam = await db
    .selectFrom("Teams as t")
    .select(["t.TeamCity", "t.TeamName", "t.TeamPrimaryColor", "t.TeamSecondaryColor"])
    .innerJoin("Games as g", "g.WinnerTeamID", "t.TeamID")
    .where("g.GameWeek", "=", week)
    .orderBy("GameKickoff", "desc")
    .executeTakeFirstOrThrow();
  const [winnerScore, loserScore] =
    homeTeam.GameHomeScore > homeTeam.GameVisitorScore
      ? [homeTeam.GameHomeScore, homeTeam.GameVisitorScore]
      : [homeTeam.GameVisitorScore, homeTeam.GameHomeScore];
  const to = [user.UserEmail];
  const emailId = await getBaseEmailClass({ to, type: "weekEnded" });
  const browserLink = getBrowserLink(emailId);
  const unsubscribeLink = getUnsubscribeLink(to);
  const subject = getSubject(week);
  const html = await getHtml({
    browserLink,
    homeTeam,
    loserScore,
    unsubscribeLink,
    userFirstName: user.UserFirstName ?? "player",
    visitorTeam,
    week,
    winnerScore,
    winnerTeam,
  });
  const text = await getPlainText({
    browserLink,
    homeTeam,
    loserScore,
    unsubscribeLink,
    userFirstName: user.UserFirstName ?? "player",
    visitorTeam,
    week,
    winnerScore,
    winnerTeam,
  });

  try {
    await sendEmail({
      html,
      subject,
      text,
      to,
    });
  } catch (error) {
    console.error("Failed to send week ended email: ", {
      error,
      props: {
        browserLink,
        homeTeam,
        loserScore,
        unsubscribeLink,
        userFirstName: user.UserFirstName ?? "player",
        visitorTeam,
        week,
        winnerScore,
        winnerTeam,
      },
      to,
      type: "weekEnded",
    });
  }

  await updateEmailClass({
    emailId,
    html,
    subject,
    text,
  });
};
