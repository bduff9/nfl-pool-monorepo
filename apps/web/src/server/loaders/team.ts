import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { cache } from "react";
import 'server-only';

export const getTeamsOnBye = cache((week: number) => {
	return db.selectFrom("Teams").select(["TeamID", 'TeamCity', 'TeamLogo', 'TeamName']).where("TeamByeWeek", "=", week).execute();
});
