import type { Users } from "@nfl-pool-monorepo/db/src";
import type { Selectable } from "kysely";

import { getBaseEmailClass, getBrowserLink, getUnsubscribeLink, sendEmail, updateEmailClass } from ".";
import { getHtml, getPlainText, getSubject } from "./templates/SurvivorEliminatedEmail";

export const sendSurvivorEliminatedEmail = async (
  user: Pick<Selectable<Users>, "UserEmail" | "UserFirstName">,
  week: number,
  pickedTeamName?: string,
): Promise<void> => {
  const to = [user.UserEmail];
  const emailId = await getBaseEmailClass({ to, type: "survivorEliminated" });
  const browserLink = getBrowserLink(emailId);
  const unsubscribeLink = getUnsubscribeLink(to);
  const subject = getSubject(week);
  const props = {
    browserLink,
    unsubscribeLink,
    userFirstName: user.UserFirstName ?? "player",
    week,
    ...(pickedTeamName !== undefined ? { pickedTeamName } : {}),
  };
  const [html, text] = await Promise.all([getHtml(props), getPlainText(props)]);

  try {
    await sendEmail({
      html,
      subject,
      text,
      to,
    });
  } catch (error) {
    console.error("Failed to send survivor eliminated email: ", { error, props, to, type: "survivorEliminated" });
  }

  await updateEmailClass({
    emailId,
    html,
    subject,
    text,
  });
};
