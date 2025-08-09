import { db } from "@nfl-pool-monorepo/db/src/kysely";
import type { User } from "@nfl-pool-monorepo/types";

import { getBaseEmailClass, getBrowserLink, getUnsubscribeLink, sendEmail, updateEmailClass } from ".";
import { getHtml, getPlainText, getSubject } from "./templates/PicksSubmitted";

export const sendPicksSubmittedEmail = async (user: User, week: number, tiebreakerLastScore: number): Promise<void> => {
  const picks = await db
    .selectFrom("Picks as p")
    .select(["p.PickPoints", "p.TeamID"])
    .innerJoin("Games as g", "g.GameID", "p.GameID")
    .leftJoin("Teams as t", "t.TeamID", "p.TeamID")
    .select(["t.TeamName", "t.TeamCity"])
    .where("g.GameWeek", "=", week)
    .where("p.UserID", "=", user.id)
    .execute();
  const userResult = await db
    .selectFrom("Users")
    .select(["UserFirstName"])
    .where("UserID", "=", user.id)
    .executeTakeFirstOrThrow();
  const to = [user.email];
  const emailId = await getBaseEmailClass({ to, type: "picksSubmitted" });
  const browserLink = getBrowserLink(emailId);
  const unsubscribeLink = getUnsubscribeLink(to);
  const subject = getSubject(week);
  const html = await getHtml({
    browserLink,
    picks,
    tiebreakerLastScore,
    unsubscribeLink,
    userFirstName: userResult.UserFirstName ?? "player",
    week,
  });
  const text = await getPlainText({
    browserLink,
    picks,
    tiebreakerLastScore,
    unsubscribeLink,
    userFirstName: userResult.UserFirstName ?? "player",
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
    console.error("Failed to send picks submitted email: ", {
      error,
      props: {
        browserLink,
        picks,
        tiebreakerLastScore,
        unsubscribeLink,
        userFirstName: userResult.UserFirstName ?? "player",
        week,
      },
      to,
      type: "picksSubmitted",
    });
  }

  await updateEmailClass({
    emailId,
    html,
    subject,
    text,
  });
};
