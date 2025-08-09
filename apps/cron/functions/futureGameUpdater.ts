import { healPicks, healWeek } from "@nfl-pool-monorepo/api/src/healing";
import { getEntireSeasonFromApi } from "@nfl-pool-monorepo/api/src/index";
import { getSystemYear } from "@nfl-pool-monorepo/db/src/queries/systemValue";
import { getCurrentWeek } from "@nfl-pool-monorepo/db/src/queries/week";
import { WEEKS_IN_SEASON } from "@nfl-pool-monorepo/utils/constants";
import type { Handler } from "aws-lambda";

export const handler: Handler<never, void> = async (_event, _context) => {
	const timeStamp = new Date().toISOString();

	console.log(`Executing future game updater at ${timeStamp}...`);
	const year = await getSystemYear();
	const season = await getEntireSeasonFromApi(year);

	if (season.length === 0) {
		console.log('API has no data for updating future weeks!');

		return;
	}

	const currentWeek = await getCurrentWeek();

	for (let week = currentWeek; week <= WEEKS_IN_SEASON; week++) {
		await healWeek(week, season);
		await healPicks(week);
	}

	console.log("Future game updater function ran!", new Date().toISOString());
};
