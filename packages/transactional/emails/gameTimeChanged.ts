import type { Users } from "@nfl-pool-monorepo/db/src";
import type { Selectable } from "kysely";

import type { GameTimeChangedInfo } from "../src/gameTimeChanged";
import { deliverEmail } from "./deliverEmail";
import { getHtml, getPlainText, getSubject } from "./templates/GameTimeChangedEmail";

export const sendGameTimeChangedEmail = async (
  user: Pick<Selectable<Users>, "UserEmail" | "UserFirstName">,
  info: GameTimeChangedInfo,
): Promise<void> => {
  await deliverEmail({
    buildProps: (links) => ({
      ...links,
      homeTeamName: info.homeTeamName,
      newKickoffLabel: info.newKickoffLabel,
      oldKickoffLabel: info.oldKickoffLabel,
      userFirstName: user.UserFirstName ?? "player",
      visitorTeamName: info.visitorTeamName,
      week: info.week,
    }),
    getHtml,
    getPlainText,
    label: "game time changed",
    subject: getSubject({ homeTeamName: info.homeTeamName, visitorTeamName: info.visitorTeamName }),
    to: [user.UserEmail],
    type: "gameTimeChanged",
  });
};
