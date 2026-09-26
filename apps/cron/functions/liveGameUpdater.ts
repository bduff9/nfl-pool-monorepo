import { getSingleWeekFromApi } from "@nfl-pool-monorepo/api/src";
import { getDbGameFromApi, parseTeamsFromApi } from "@nfl-pool-monorepo/api/src/utils";
import {
  updateBestPlacementOverall,
  updateBestPlacementWeekly,
} from "@nfl-pool-monorepo/db/src/mutations/bestPlacement";
import { updateDBGame, updateSpreads } from "@nfl-pool-monorepo/db/src/mutations/game";
import { updateOverallMV } from "@nfl-pool-monorepo/db/src/mutations/overallMv";
import { lockLatePaymentUsers, updateAllPayouts } from "@nfl-pool-monorepo/db/src/mutations/payment";
import { updateMissedPicks } from "@nfl-pool-monorepo/db/src/mutations/pick";
import { updateSurvivorMV } from "@nfl-pool-monorepo/db/src/mutations/survivorMv";
import { markEmptySurvivorPicksAsDead } from "@nfl-pool-monorepo/db/src/mutations/survivorPick";
import { setSystemValue } from "@nfl-pool-monorepo/db/src/mutations/systemValue";
import { updateTeamData } from "@nfl-pool-monorepo/db/src/mutations/team";
import { updateWeeklyMV } from "@nfl-pool-monorepo/db/src/mutations/weeklyMv";
import { checkDBIfUpdatesNeeded, hasUnfinishedGames } from "@nfl-pool-monorepo/db/src/queries/game";
import { getSystemYear, hasSystemValue } from "@nfl-pool-monorepo/db/src/queries/systemValue";
import { getTeamsFromDB } from "@nfl-pool-monorepo/db/src/queries/team";
import { getCurrentWeek } from "@nfl-pool-monorepo/db/src/queries/week";
import {
  sendWeekEndedNotifications,
  sendWeeklyEmails,
  sendWeekStartedNotifications,
} from "@nfl-pool-monorepo/transactional/src/alerts";
import { sendPicksAutoSubmittedNotifications } from "@nfl-pool-monorepo/transactional/src/picksAutoSubmitted";
import { sendSurvivorEliminatedNotifications } from "@nfl-pool-monorepo/transactional/src/survivorEliminated";
import type { Handler } from "aws-lambda";

/**
 * Week-end work (payouts, notifications, late-payment locks) only ran when the API showed
 * the last game flipping to Final, so a failure mid-block skipped it forever. Gating on a
 * durable flag makes it retriable: any later run that sees every game Final picks the
 * block back up until it completes.
 */
const finalizeWeekIfNeeded = async (week: number): Promise<void> => {
  const finalizedFlag = `Finalized-${await getSystemYear()}-${week}`;

  if (await hasSystemValue(finalizedFlag)) {
    return;
  }

  if (await hasUnfinishedGames(week)) {
    return;
  }

  console.log(`Finalizing week ${week}...`);

  await updateAllPayouts(week);
  await sendWeekEndedNotifications(week);
  await sendWeeklyEmails(week);
  await lockLatePaymentUsers(week);
  await setSystemValue(finalizedFlag, "1");

  console.log(`Week ${week} finalized!`);
};

// fallow-ignore-next-line complexity -- per-game orchestration hub; the notification sends mirror the existing week-started pattern
export const handler: Handler<never, void> = async (_event, _context) => {
  const timeStamp = new Date().toISOString();

  console.log(`Executing live game updater at ${timeStamp}...`);

  const currentWeek = await getCurrentWeek();
  const needUpdates = await checkDBIfUpdatesNeeded(currentWeek);

  if (!needUpdates) {
    console.log("No games need to be updated, exiting...");

    await finalizeWeekIfNeeded(currentWeek);

    return;
  }

  const games = await getSingleWeekFromApi(currentWeek);
  const now = new Date();
  let needMVsUpdated = false;

  if (games.length === 0) {
    console.log("No games found from API, check earlier errors in loading them.  Exiting...");

    await finalizeWeekIfNeeded(currentWeek);

    return;
  }

  const teams = await getTeamsFromDB();

  for (const game of games) {
    try {
      const kickoff = game.kickoff;

      for (const team of game.team) {
        const teamID = teams[team.id];

        if (teamID === undefined) {
          throw new Error(`Team ${team.id} from API not found in DB`);
        }

        // react-doctor-disable-next-line async-await-in-loop -- team updates for this game are sequential DB writes, not independent work
        await updateTeamData(teamID, team, currentWeek);
      }

      if (now < kickoff || game.status === "SCHED") {
        await updateSpreads(currentWeek, game);

        continue;
      }

      const [homeTeam, visitingTeam] = parseTeamsFromApi(game.team);
      let dbGame = await getDbGameFromApi(currentWeek, homeTeam.id, visitingTeam.id);
      const oldStatus = dbGame.GameStatus;

      if (oldStatus === "Pregame") {
        const autoFilledPicks = await updateMissedPicks(dbGame);
        await sendPicksAutoSubmittedNotifications(currentWeek, autoFilledPicks);

        if (dbGame.GameNumber === 1) {
          const startedFlag = `Started-${await getSystemYear()}-${currentWeek}`;

          // Set the flag before sending so an overlapping run can't double-send
          // week-start notifications.
          if (!(await hasSystemValue(startedFlag))) {
            await setSystemValue(startedFlag, "1");
            await sendWeekStartedNotifications(currentWeek);
            const eliminatedUserIDs = await markEmptySurvivorPicksAsDead(currentWeek);
            await sendSurvivorEliminatedNotifications(currentWeek, eliminatedUserIDs);
            await updateSurvivorMV(currentWeek);
          }
        }
      }

      const { eliminatedUserIDs, ...updatedGame } = await updateDBGame(game, dbGame);
      dbGame = updatedGame;

      if (dbGame.GameStatus === "Final" && oldStatus !== dbGame.GameStatus) {
        needMVsUpdated = true;
        await sendSurvivorEliminatedNotifications(currentWeek, eliminatedUserIDs);
      }
    } catch (error) {
      console.error("Failed to process game update, continuing with remaining games", { error, game });
    }
  }

  if (needMVsUpdated) {
    await updateWeeklyMV(currentWeek);
    await updateOverallMV(currentWeek);
    await updateSurvivorMV(currentWeek);
    await updateBestPlacementWeekly(currentWeek);
    await updateBestPlacementOverall(currentWeek);
  }

  await finalizeWeekIfNeeded(currentWeek);

  console.log("Live game updater function ran!", new Date().toISOString());
};
