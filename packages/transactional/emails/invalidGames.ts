import { parseTeamsFromApi } from "@nfl-pool-monorepo/api/src/utils";
import { db } from "@nfl-pool-monorepo/db/src/kysely";
import type { getGamesForWeek } from "@nfl-pool-monorepo/db/src/queries/game";

import { getBaseEmailClass, getBrowserLink, getUnsubscribeLink, sendEmail, updateEmailClass } from ".";
import type { ApiMatchup } from "./../../api/src/zod";
import { getHtml, getPlainText, getSubject } from "./templates/InvalidGamesEmail";

type InvalidGameMessage = {
  game: string;
  reason: string;
};

export const sendInvalidGamesEmail = async (
  week: number,
  invalidAPIGames: ApiMatchup[],
  invalidDBGames: Awaited<ReturnType<typeof getGamesForWeek>>,
): Promise<void> => {
  const admins = await db
    .selectFrom("Users")
    .select(["UserFirstName", "UserEmail"])
    .where("UserIsAdmin", "=", 1)
    .execute();
  const messages: InvalidGameMessage[] = [];

  invalidAPIGames.forEach((game) => {
    const [home, visitor] = parseTeamsFromApi(game.team);

    messages.push({
      game: `${visitor.id} @ ${home.id} starting at ${game.kickoff}`,
      reason: "Game is found in API but not in database",
    });
  });

  invalidDBGames.forEach((game) => {
    messages.push({
      game: `${game.visitorTeam?.TeamShortName} @ ${game.homeTeam?.TeamShortName} starting at ${game.GameKickoff}`,
      reason: "Game is found in database but not in API",
    });
  });

  await Promise.allSettled(
    admins.map(async (admin) => {
      const to = [admin.UserEmail];
      const emailId = await getBaseEmailClass({ to, type: "invalidGames" });
      const browserLink = getBrowserLink(emailId);
      const unsubscribeLink = getUnsubscribeLink(to);
      const subject = getSubject(messages.length, week);
      const html = await getHtml({
        adminUserFirstName: admin.UserFirstName ?? "",
        browserLink,
        messages,
        unsubscribeLink,
        week,
      });
      const text = await getPlainText({
        adminUserFirstName: admin.UserFirstName ?? "",
        browserLink,
        messages,
        unsubscribeLink,
        week,
      });

      try {
        await sendEmail({
          html,
          subject,
          text,
          to,
        });
      } catch (error) {
        console.error("Failed to send invalid games email: ", {
          error,
          props: {
            adminUserFirstName: admin.UserFirstName ?? "",
            browserLink,
            messages,
            unsubscribeLink,
            week,
          },
          to,
          type: "invalidGames",
        });
      }

      await updateEmailClass({
        emailId,
        html,
        subject,
        text,
      });
    }),
  );
};
