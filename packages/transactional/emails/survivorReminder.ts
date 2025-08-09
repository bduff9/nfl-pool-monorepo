import type { Users } from "@nfl-pool-monorepo/db/src";
import type { Selectable } from "kysely";

import { getBaseEmailClass, getBrowserLink, getUnsubscribeLink, sendEmail, updateEmailClass } from ".";
import { getHtml, getPlainText, getSubject } from "./templates/SurvivorReminder";

export const sendSurvivorReminderEmail = async (
  user: Pick<Selectable<Users>, "UserEmail" | "UserFirstName">,
  week: number,
  hoursLeft: number,
): Promise<void> => {
  const to = [user.UserEmail];
  const emailId = await getBaseEmailClass({ to, type: "survivorReminder" });
  const browserLink = getBrowserLink(emailId);
  const unsubscribeLink = getUnsubscribeLink(to);
  const subject = getSubject(user.UserFirstName ?? "player");
  const html = await getHtml({
    browserLink,
    hoursLeft,
    unsubscribeLink,
    userFirstName: user.UserFirstName ?? "player",
    week,
  });
  const text = await getPlainText({
    browserLink,
    hoursLeft,
    unsubscribeLink,
    userFirstName: user.UserFirstName ?? "player",
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
    console.error("Failed to send survivor reminder email: ", {
      error,
      props: {
        browserLink,
        hoursLeft,
        unsubscribeLink,
        userFirstName: user.UserFirstName ?? "player",
        week,
      },
      to,
      type: "survivorReminder",
    });
  }

  await updateEmailClass({
    emailId,
    html,
    subject,
    text,
  });
};
