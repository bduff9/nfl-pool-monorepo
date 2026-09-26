import type { Users } from "@nfl-pool-monorepo/db/src";
import type { Selectable } from "kysely";

import type { GameTimeChangedInfo } from "../src/gameTimeChanged";
import { sendSMS } from ".";

const sendGameTimeChangedSMS = async (
  user: Pick<Selectable<Users>, "UserPhone" | "UserFirstName">,
  info: GameTimeChangedInfo,
): Promise<void> => {
  const message = `${user.UserFirstName}, kickoff for ${info.visitorTeamName} @ ${info.homeTeamName} (week ${info.week}) changed from ${info.oldKickoffLabel} to ${info.newKickoffLabel}`;

  try {
    if (!user.UserPhone) {
      throw new Error("Missing phone number for user!");
    }

    await sendSMS(user.UserPhone, message, "gameTimeChanged");
  } catch (error) {
    console.error("Failed to send game time changed sms: ", { error, message, type: "gameTimeChanged", user });
  }
};

export default sendGameTimeChangedSMS;
