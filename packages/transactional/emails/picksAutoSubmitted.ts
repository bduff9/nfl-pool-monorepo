import type { Users } from "@nfl-pool-monorepo/db/src";
import type { Selectable } from "kysely";

import type { PicksAutoSubmittedInfo } from "../src/picksAutoSubmitted";
import { getBaseEmailClass, getBrowserLink, getUnsubscribeLink, sendEmail, updateEmailClass } from ".";
import { getHtml, getPlainText, getSubject } from "./templates/PicksAutoSubmittedEmail";

export const sendPicksAutoSubmittedEmail = async (
  user: Pick<Selectable<Users>, "UserEmail" | "UserFirstName">,
  info: PicksAutoSubmittedInfo,
): Promise<void> => {
  const to = [user.UserEmail];
  const emailId = await getBaseEmailClass({ to, type: "picksAutoSubmitted" });
  const browserLink = getBrowserLink(emailId);
  const unsubscribeLink = getUnsubscribeLink(to);
  const subject = getSubject(info.week);
  const props = {
    browserLink,
    homeTeamName: info.homeTeamName,
    pickPoints: info.pickPoints,
    unsubscribeLink,
    userFirstName: user.UserFirstName ?? "player",
    visitorTeamName: info.visitorTeamName,
    week: info.week,
    ...(info.pickedTeamName !== undefined ? { pickedTeamName: info.pickedTeamName } : {}),
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
    console.error("Failed to send picks auto submitted email: ", { error, props, to, type: "picksAutoSubmitted" });
  }

  await updateEmailClass({
    emailId,
    html,
    subject,
    text,
  });
};
