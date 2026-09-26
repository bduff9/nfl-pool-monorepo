import type { Users } from "@nfl-pool-monorepo/db/src";
import type { Selectable } from "kysely";

import type { PicksAutoSubmittedInfo } from "../src/picksAutoSubmitted";
import { sendSMS } from ".";

const sendPicksAutoSubmittedSMS = async (
  user: Pick<Selectable<Users>, "UserPhone" | "UserFirstName">,
  info: PicksAutoSubmittedInfo,
): Promise<void> => {
  const detail = info.pickedTeamName
    ? `we auto-picked your ${info.pickedTeamName} with ${info.pickPoints} points`
    : `we auto-assigned ${info.pickPoints} points to it`;
  const message = `${user.UserFirstName}, you missed the week ${info.week} ${info.visitorTeamName} @ ${info.homeTeamName} game, so ${detail}`;

  try {
    if (!user.UserPhone) {
      throw new Error("Missing phone number for user!");
    }

    await sendSMS(user.UserPhone, message, "picksAutoSubmitted");
  } catch (error) {
    console.error("Failed to send picks auto submitted sms: ", { error, message, type: "picksAutoSubmitted", user });
  }
};

export default sendPicksAutoSubmittedSMS;
