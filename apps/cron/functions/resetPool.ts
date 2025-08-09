import { getEntireSeasonFromApi } from "@nfl-pool-monorepo/api/src";
import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { populateGames } from "@nfl-pool-monorepo/db/src/mutations/game";
import { populateWinnerHistory } from "@nfl-pool-monorepo/db/src/mutations/history";
import { clearOldUserData } from "@nfl-pool-monorepo/db/src/mutations/users";
import { verifySeasonYearForReset } from "@nfl-pool-monorepo/db/src/queries/systemValue";
import { ADMIN_USER } from "@nfl-pool-monorepo/utils/constants";
import type { Handler } from "aws-lambda";
import { sql } from "kysely";

export const handler: Handler<never, void> = async (_event, _context) => {
  const timeStamp = new Date().toISOString();

  console.log(`Executing reset pool at ${timeStamp}...`);

  const nextSeasonYear = await verifySeasonYearForReset();

  if (!nextSeasonYear) {
    console.log("Pool is not ready for reset!");

    return;
  }

  const newSeason = await getEntireSeasonFromApi(nextSeasonYear);

  if (newSeason.length === 0) {
    console.log("API has no data for reset!");

    return;
  }

  try {
    await db.transaction().execute(async (trx) => {
      // Clear/reset old data
      await populateWinnerHistory(trx);
      await sql<void>`SET FOREIGN_KEY_CHECKS = 0`.execute(trx);
      await Promise.all([
        trx.deleteFrom("ApiCalls").executeTakeFirstOrThrow(),
        trx.deleteFrom("Emails").executeTakeFirstOrThrow(),
        trx.deleteFrom("Logs").executeTakeFirstOrThrow(),
        trx.deleteFrom("Picks").executeTakeFirstOrThrow(),
        trx.deleteFrom("Tiebreakers").executeTakeFirstOrThrow(),
        trx.deleteFrom("OverallMV").executeTakeFirstOrThrow(),
        trx.deleteFrom("WeeklyMV").executeTakeFirstOrThrow(),
        trx.deleteFrom("SurvivorPicks").executeTakeFirstOrThrow(),
        trx.deleteFrom("SurvivorMV").executeTakeFirstOrThrow(),
        trx.deleteFrom("Games").executeTakeFirstOrThrow(),
        trx
          .updateTable("Teams")
          .set({
            TeamByeWeek: 0,
            TeamPassDefenseRank: null,
            TeamPassOffenseRank: null,
            TeamRushDefenseRank: null,
            TeamRushOffenseRank: null,
          })
          .executeTakeFirstOrThrow(),
        clearOldUserData(trx),
        trx.deleteFrom("VerificationRequests").executeTakeFirstOrThrow(),
        trx.deleteFrom("Sessions").executeTakeFirstOrThrow(),
        trx.deleteFrom("Payments").executeTakeFirstOrThrow(),
        trx
          .updateTable("SystemValues")
          .set({ SystemValueUpdated: new Date(), SystemValueUpdatedBy: ADMIN_USER, SystemValueValue: null })
          .where("SystemValueName", "in", ["OverallPrizes", "WeeklyPrizes", "SurvivorPrizes"])
          .executeTakeFirstOrThrow(),
      ]);
      await sql<void>`SET FOREIGN_KEY_CHECKS = 1`.execute(trx);

      // Populate new season data
      await populateGames(trx, newSeason);
      await trx
        .updateTable("SystemValues")
        .set({
          SystemValueUpdated: new Date(),
          SystemValueUpdatedBy: ADMIN_USER,
          SystemValueValue: `${nextSeasonYear}`,
        })
        .where("SystemValueName", "=", "YearUpdated")
        .executeTakeFirstOrThrow();
    });
  } catch (error) {
    console.error("Error resetting pool:", error);
  }

  console.log("Reset pool function ran!", new Date().toISOString());
};
