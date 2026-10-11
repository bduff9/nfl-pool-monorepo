import type { Users } from "@nfl-pool-monorepo/db/src";
import type { Selectable } from "kysely";

import { deliverEmail } from "./deliverEmail";
import { getHtml, getPlainText, getSubject } from "./templates/SurvivorEliminatedEmail";

export const sendSurvivorEliminatedEmail = async (
  user: Pick<Selectable<Users>, "UserEmail" | "UserFirstName">,
  week: number,
  pickedTeamName?: string,
): Promise<void> => {
  await deliverEmail({
    buildProps: (links) => ({
      ...links,
      userFirstName: user.UserFirstName ?? "player",
      week,
      ...(pickedTeamName !== undefined ? { pickedTeamName } : {}),
    }),
    getHtml,
    getPlainText,
    label: "survivor eliminated",
    subject: getSubject(week),
    to: [user.UserEmail],
    type: "survivorEliminated",
  });
};
