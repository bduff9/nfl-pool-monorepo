import type { Users } from "@nfl-pool-monorepo/db/src";
import type { Selectable } from "kysely";

import type { GameTimeChangedInfo } from "../src/gameTimeChanged";
import { sendPushNotification } from ".";

const sendGameTimeChangedPushNotification = async (
  user: Pick<Selectable<Users>, "UserID" | "UserFirstName">,
  info: GameTimeChangedInfo,
): Promise<void> => {
  const message = `${info.visitorTeamName} @ ${info.homeTeamName} (week ${info.week}) now kicks off ${info.newKickoffLabel} instead of ${info.oldKickoffLabel}`;

  await sendPushNotification(user.UserID, "Game Time Changed", message, "gameTimeChanged");
};

export default sendGameTimeChangedPushNotification;
