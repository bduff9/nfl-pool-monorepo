import { getSingleWeekFromApi } from "@nfl-pool-monorepo/api/src/index";
import { updateTeamData } from "@nfl-pool-monorepo/api/src/utils";
import { updateSpreads } from "@nfl-pool-monorepo/db/src/mutations/game";
import { getHoursToWeekStart } from "@nfl-pool-monorepo/db/src/queries/game";
import { getCurrentWeek } from "@nfl-pool-monorepo/db/src/queries/week";
import {
  sendReminderEmails,
  sendReminderPushNotifications,
  sendReminderTexts,
} from "@nfl-pool-monorepo/transactional/src/reminders";
import type { Handler } from "aws-lambda";

export const handler: Handler<never, void> = async (_event, _context) => {
  const currentWeek = await getCurrentWeek();
  const games = await getSingleWeekFromApi(currentWeek);

  for (const game of games) {
    try {
      await updateSpreads(currentWeek, game);

      for (const team of game.team) {
        // react-doctor-disable-next-line async-await-in-loop -- team updates for this game are sequential DB writes, not independent work
        await updateTeamData(team.id, team, currentWeek);
      }
    } catch (error) {
      console.error("Failed to update spread/team data for game, continuing with remaining games", { error, game });
    }
  }

  const hours = await getHoursToWeekStart(currentWeek);

  console.log(`${hours} hours until week ${currentWeek} starts!`);

  if (hours > 0) {
    await sendReminderEmails(hours, currentWeek);
    await sendReminderTexts(hours, currentWeek);
    await sendReminderPushNotifications(hours, currentWeek);
  }

  console.log("Current week updater function ran!", new Date().toISOString());
};
