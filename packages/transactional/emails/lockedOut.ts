import { db } from "@nfl-pool-monorepo/db/src/kysely";

import { getPaymentDueDate } from "./../../db/src/queries/systemValue";
import { getBaseEmailClass, getBrowserLink, getUnsubscribeLink, sendEmail, updateEmailClass } from ".";
import { getHtml, getPlainText, getSubject } from "./templates/LockedOutEmail";

export const sendLockedOutEmail = async (userId: number, balance: number, week: number): Promise<void> => {
  const user = await db
    .selectFrom("Users")
    .select(["UserEmail", "UserFirstName"])
    .where("UserID", "=", userId)
    .executeTakeFirstOrThrow();
  const nextWeek = week + 1;
  const nextGame = await db
    .selectFrom("Games")
    .select(["GameKickoff"])
    .where("GameWeek", "=", nextWeek)
    .where("GameNumber", "=", 1)
    .executeTakeFirstOrThrow();
  const to = [user.UserEmail];
  const emailId = await getBaseEmailClass({ to, type: "lockedOut" });
  const browserLink = getBrowserLink(emailId);
  const unsubscribeLink = getUnsubscribeLink(to);
  const paymentDueDate = await getPaymentDueDate();
  const subject = getSubject();
  const html = await getHtml({
    balance,
    browserLink,
    nextKickoff: nextGame.GameKickoff,
    nextWeek,
    paymentDueDate,
    unsubscribeLink,
    userFirstName: user.UserFirstName ?? "",
  });
  const text = await getPlainText({
    balance,
    browserLink,
    nextKickoff: nextGame.GameKickoff,
    nextWeek,
    paymentDueDate,
    unsubscribeLink,
    userFirstName: user.UserFirstName ?? "",
  });

  try {
    await sendEmail({
      html,
      subject,
      text,
      to,
    });
  } catch (error) {
    console.error("Failed to send locked out email: ", {
      error,
      props: {
        balance,
        browserLink,
        nextKickoff: nextGame.GameKickoff,
        nextWeek,
        paymentDueDate,
        unsubscribeLink,
        userFirstName: user.UserFirstName ?? "",
      },
      to,
      type: "lockedOut",
    });
  }

  await updateEmailClass({
    emailId,
    html,
    subject,
    text,
  });
};
