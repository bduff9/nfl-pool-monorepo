import type { Users } from "@nfl-pool-monorepo/db/src";
import type { Selectable } from "kysely";

import type { PicksAutoSubmittedInfo } from "../src/picksAutoSubmitted";
import { deliverEmail } from "./deliverEmail";
import { getHtml, getPlainText, getSubject } from "./templates/PicksAutoSubmittedEmail";

export const sendPicksAutoSubmittedEmail = async (
  user: Pick<Selectable<Users>, "UserEmail" | "UserFirstName">,
  info: PicksAutoSubmittedInfo,
): Promise<void> => {
  await deliverEmail({
    buildProps: (links) => ({
      ...links,
      homeTeamName: info.homeTeamName,
      pickPoints: info.pickPoints,
      userFirstName: user.UserFirstName ?? "player",
      visitorTeamName: info.visitorTeamName,
      week: info.week,
      ...(info.pickedTeamName !== undefined ? { pickedTeamName: info.pickedTeamName } : {}),
    }),
    getHtml,
    getPlainText,
    label: "picks auto submitted",
    subject: getSubject(info.week),
    to: [user.UserEmail],
    type: "picksAutoSubmitted",
  });
};
