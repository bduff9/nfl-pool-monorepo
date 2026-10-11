import type { Users } from "@nfl-pool-monorepo/db/src";
import type { Selectable } from "kysely";

import { getFirstGameTeams } from "../src/weekTeams";
import { deliverEmail } from "./deliverEmail";
import { getHtml, getPlainText, getSubject } from "./templates/QuickPickEmail";

export const sendQuickPickEmail = async (
  user: Pick<Selectable<Users>, "UserID" | "UserEmail" | "UserFirstName">,
  week: number,
  hoursLeft: number,
): Promise<void> => {
  const { homeTeam, visitorTeam } = await getFirstGameTeams(week);

  await deliverEmail({
    buildProps: (links) => ({
      ...links,
      homeTeam,
      hoursLeft,
      userFirstName: user.UserFirstName ?? "player",
      userId: user.UserID,
      visitorTeam,
      week,
    }),
    getHtml,
    getPlainText,
    label: "quick pick",
    subject: getSubject(user.UserFirstName ?? "player"),
    to: [user.UserEmail],
    type: "quickPick",
  });
};
