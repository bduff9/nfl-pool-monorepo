import type { Users } from "@nfl-pool-monorepo/db/src";
import type { Selectable } from "kysely";

import type { PicksAutoSubmittedInfo } from "../src/picksAutoSubmitted";
import { sendPushNotification } from ".";

const sendPicksAutoSubmittedPushNotification = async (
  user: Pick<Selectable<Users>, "UserID" | "UserFirstName">,
  info: PicksAutoSubmittedInfo,
): Promise<void> => {
  const detail = info.pickedTeamName
    ? `we auto-picked your ${info.pickedTeamName} with ${info.pickPoints} points`
    : `we auto-assigned ${info.pickPoints} points to it`;
  const message = `You missed the week ${info.week} ${info.visitorTeamName} @ ${info.homeTeamName} game, so ${detail}.`;

  await sendPushNotification(user.UserID, "Picks Submitted For You", message, "picksAutoSubmitted");
};

export default sendPicksAutoSubmittedPushNotification;
