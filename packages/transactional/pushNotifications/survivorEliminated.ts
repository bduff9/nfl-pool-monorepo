import type { Users } from "@nfl-pool-monorepo/db/src";
import type { Selectable } from "kysely";

import { sendPushNotification } from ".";

const sendSurvivorEliminatedPushNotification = async (
  user: Pick<Selectable<Users>, "UserID" | "UserFirstName">,
  week: number,
  pickedTeamName?: string,
): Promise<void> => {
  const reason = pickedTeamName ? `your ${pickedTeamName} pick lost` : "you didn't make a pick";
  const message = `You're out of the survivor pool after week ${week} (${reason}). The overall confidence pool is still wide open though!`;

  await sendPushNotification(user.UserID, "Survivor Pool", message, "survivorEliminated");
};

export default sendSurvivorEliminatedPushNotification;
