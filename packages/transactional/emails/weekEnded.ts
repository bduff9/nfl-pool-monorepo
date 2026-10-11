import type { Users } from "@nfl-pool-monorepo/db/src";
import type { Selectable } from "kysely";

import { getWeekEndedResult } from "../src/weekTeams";
import { deliverEmail } from "./deliverEmail";
import { getHtml, getPlainText, getSubject } from "./templates/WeekEndedEmail";

export const sendWeekEndedEmail = async (
  user: Pick<Selectable<Users>, "UserEmail" | "UserFirstName">,
  week: number,
): Promise<void> => {
  const { homeTeam, loserScore, visitorTeam, winnerScore, winnerTeam } = await getWeekEndedResult(week);

  await deliverEmail({
    buildProps: (links) => ({
      ...links,
      homeTeam,
      loserScore,
      userFirstName: user.UserFirstName ?? "player",
      visitorTeam,
      week,
      winnerScore,
      winnerTeam,
    }),
    getHtml,
    getPlainText,
    label: "week ended",
    subject: getSubject(week),
    to: [user.UserEmail],
    type: "weekEnded",
  });
};
