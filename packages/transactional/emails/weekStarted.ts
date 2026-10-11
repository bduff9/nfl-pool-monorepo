import type { Users } from "@nfl-pool-monorepo/db/src";
import type { Selectable } from "kysely";

import { getFirstGameTeams } from "../src/weekTeams";
import { deliverEmail } from "./deliverEmail";
import { getHtml, getPlainText, getSubject } from "./templates/WeekStartedEmail";

export const sendWeekStartedEmail = async (
  user: Pick<Selectable<Users>, "UserEmail" | "UserFirstName">,
  week: number,
): Promise<void> => {
  const { homeTeam, visitorTeam } = await getFirstGameTeams(week);

  await deliverEmail({
    buildProps: (links) => ({
      ...links,
      homeTeam,
      userFirstName: user.UserFirstName ?? "player",
      visitorTeam,
      week,
    }),
    getHtml,
    getPlainText,
    label: "week started",
    subject: getSubject(week),
    to: [user.UserEmail],
    type: "weekStarted",
  });
};
