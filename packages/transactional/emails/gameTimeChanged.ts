import type { Users } from "@nfl-pool-monorepo/db/src";
import type { Selectable } from "kysely";

import type { GameTimeChangedInfo } from "../src/gameTimeChanged";
import { getBaseEmailClass, getBrowserLink, getUnsubscribeLink, sendEmail, updateEmailClass } from ".";
import { getHtml, getPlainText, getSubject } from "./templates/GameTimeChangedEmail";

export const sendGameTimeChangedEmail = async (
  user: Pick<Selectable<Users>, "UserEmail" | "UserFirstName">,
  info: GameTimeChangedInfo,
): Promise<void> => {
  const to = [user.UserEmail];
  const emailId = await getBaseEmailClass({ to, type: "gameTimeChanged" });
  const browserLink = getBrowserLink(emailId);
  const unsubscribeLink = getUnsubscribeLink(to);
  const subject = getSubject({ homeTeamName: info.homeTeamName, visitorTeamName: info.visitorTeamName });
  const props = {
    browserLink,
    homeTeamName: info.homeTeamName,
    newKickoffLabel: info.newKickoffLabel,
    oldKickoffLabel: info.oldKickoffLabel,
    unsubscribeLink,
    userFirstName: user.UserFirstName ?? "player",
    visitorTeamName: info.visitorTeamName,
    week: info.week,
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
    console.error("Failed to send game time changed email: ", { error, props, to, type: "gameTimeChanged" });
  }

  await updateEmailClass({
    emailId,
    html,
    subject,
    text,
  });
};
