import { getSingleWeekFromApi } from "@nfl-pool-monorepo/api/src";
import { getDbGameFromApi, parseTeamsFromApi } from "@nfl-pool-monorepo/api/src/utils";
import { updateDBGame, updateSpreads } from "@nfl-pool-monorepo/db/src/mutations/game";
import { updateTeamData } from "@nfl-pool-monorepo/db/src/mutations/team";
import { checkDBIfUpdatesNeeded } from "@nfl-pool-monorepo/db/src/queries/game";
import { getTeamFromDB } from "@nfl-pool-monorepo/db/src/queries/team";
import { getCurrentWeek } from "@nfl-pool-monorepo/db/src/queries/week";
import type { Handler } from "aws-lambda";
import { updateMissedPicks } from "@nfl-pool-monorepo/db/src/mutations/pick";
import { markEmptySurvivorPicksAsDead } from "@nfl-pool-monorepo/db/src/mutations/survivorPick";
import { updateOverallMV } from "@nfl-pool-monorepo/db/src/mutations/overallMv";
import { updateSurvivorMV } from "@nfl-pool-monorepo/db/src/mutations/survivorMv";
import { updateWeeklyMV } from "@nfl-pool-monorepo/db/src/mutations/weeklyMv";
import { sendWeekEndedNotifications, sendWeeklyEmails, sendWeekStartedNotifications } from "@nfl-pool-monorepo/transactional/src/alerts";
import { lockLatePaymentUsers, updateAllPayouts } from "@nfl-pool-monorepo/db/src/mutations/payment";

export const handler: Handler<never, void> = async (_event, _context) => {
	const timeStamp = new Date().toISOString();

	console.log(`Executing live game updater at ${timeStamp}...`);

	const currentWeek = await getCurrentWeek();
	const needUpdates = await checkDBIfUpdatesNeeded(currentWeek);

	if (!needUpdates) {
		console.log('No games need to be updated, exiting...');

		return;
	}

	const games = await getSingleWeekFromApi(currentWeek);
	const now = new Date();
	let gamesLeft = games.length;
	let needMVsUpdated = false;

	if (gamesLeft === 0) {
		console.log(
			'No games found from API, check earlier errors in loading them.  Exiting...',
		);

		return;
	}

	for (const game of games) {
		const kickoff = game.kickoff;

		for (const team of game.team) {
			const dbTeam = await getTeamFromDB(team.id);

			await updateTeamData(dbTeam.TeamID, team, currentWeek);
		}

		if (now < kickoff || game.status === 'SCHED') {
			await updateSpreads(currentWeek, game);

			continue;
		}

		const [homeTeam, visitingTeam] = parseTeamsFromApi(game.team);
		let dbGame = await getDbGameFromApi(currentWeek, homeTeam.id, visitingTeam.id);
		const oldStatus = dbGame.GameStatus;

		if (oldStatus === 'Pregame') {
			await updateMissedPicks(dbGame);

			if (dbGame.GameNumber === 1) {
				await sendWeekStartedNotifications(currentWeek);
				await markEmptySurvivorPicksAsDead(currentWeek);
				await updateSurvivorMV(currentWeek);
			}
		}

		dbGame = await updateDBGame(game, dbGame);

		if (dbGame.GameStatus === 'Final') {
			gamesLeft--;

			if (oldStatus !== dbGame.GameStatus) {
				needMVsUpdated = true;
			}
		}
	}

	if (needMVsUpdated) {
		await updateWeeklyMV(currentWeek);
		await updateOverallMV(currentWeek);
		await updateSurvivorMV(currentWeek);
	}

	if (gamesLeft === 0) {
		await updateAllPayouts(currentWeek);
		await sendWeekEndedNotifications(currentWeek);
		await sendWeeklyEmails(currentWeek);
		await lockLatePaymentUsers(currentWeek);
	}

	console.log("Live game updater function ran!", new Date().toISOString());
};
