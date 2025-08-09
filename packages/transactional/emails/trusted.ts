import type { Users } from "@nfl-pool-monorepo/db/src";
import type { Selectable } from "kysely";

import { getPaymentDueDate, getSystemYear } from "./../../db/src/queries/systemValue";
import { getBaseEmailClass, getBrowserLink, getUnsubscribeLink, sendEmail, updateEmailClass } from ".";
import { getHtml, getPlainText, getSubject } from "./templates/TrustedEmail";

export const sendTrustedEmail = async (user: Pick<Selectable<Users>, "UserEmail" | "UserFirstName">): Promise<void> => {
  const to = [user.UserEmail];
  const emailId = await getBaseEmailClass({ to, type: "trusted" });
  const browserLink = getBrowserLink(emailId);
  const unsubscribeLink = getUnsubscribeLink(to);
  const year = await getSystemYear();
  const paymentDueDate = await getPaymentDueDate();
  const subject = getSubject(year);
  const html = await getHtml({
    browserLink,
    paymentDueDate,
    unsubscribeLink,
    userFirstName: user.UserFirstName ?? "",
    year,
  });
  const text = await getPlainText({
    browserLink,
    paymentDueDate,
    unsubscribeLink,
    userFirstName: user.UserFirstName ?? "",
    year,
  });

  try {
    await sendEmail({
      html,
      subject,
      text,
      to,
    });
  } catch (error) {
    console.error("Failed to send trusted email: ", {
      error,
      props: {
        browserLink,
        paymentDueDate,
        unsubscribeLink,
        userFirstName: user.UserFirstName ?? "",
        year,
      },
      to,
      type: "trusted",
    });
  }

  await updateEmailClass({
    emailId,
    html,
    subject,
    text,
  });
};
