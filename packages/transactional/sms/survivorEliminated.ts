import type { Users } from "@nfl-pool-monorepo/db/src";
import type { Selectable } from "kysely";

import { sendSMS } from ".";

const sendSurvivorEliminatedSMS = async (
  user: Pick<Selectable<Users>, "UserPhone" | "UserFirstName">,
  week: number,
  pickedTeamName?: string,
): Promise<void> => {
  const reason = pickedTeamName ? `your ${pickedTeamName} pick lost` : "you didn't make a pick";
  const message = `${user.UserFirstName}, you're out of the survivor pool after week ${week} (${reason}). The overall confidence pool is still wide open though!`;

  try {
    if (!user.UserPhone) {
      throw new Error("Missing phone number for user!");
    }

    await sendSMS(user.UserPhone, message, "survivorEliminated");
  } catch (error) {
    console.error("Failed to send survivor eliminated sms: ", { error, message, type: "survivorEliminated", user });
  }
};

export default sendSurvivorEliminatedSMS;
