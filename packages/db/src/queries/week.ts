import { MILLISECONDS_IN_SECOND, MINUTES_IN_HOUR, SECONDS_IN_MINUTE } from "@nfl-pool-monorepo/utils/constants";

import { db } from "../kysely";

export const getCurrentWeek = async () => {
  let week = 0;

  try {
    /**
     * Get next game (first not completed game)
     */
    const nextGame = await db
      .selectFrom("Games")
      .select(["GameWeek", "GameNumber", "GameKickoff"])
      .orderBy("GameKickoff", "asc")
      .where("GameStatus", "<>", "Final")
      .executeTakeFirstOrThrow();

    /**
     * If week was passed in as zero (meaning it is looking for
     * selected week not current week) and the next upcoming game
     * is game 1, see if its within 36 hours of kickoff,
     * otherwise go back to last week so people can view their
     * results.
     */
    if (nextGame.GameNumber === 1) {
      const now = new Date();
      const buffer = new Date(
        nextGame.GameKickoff.getTime() - 36 * MINUTES_IN_HOUR * SECONDS_IN_MINUTE * MILLISECONDS_IN_SECOND,
      );

      if (now < buffer) {
        week = nextGame.GameWeek - 1;
      }
    }

    /**
     * If we still haven't set a week yet by the time we get
     * here, go with next game's week.
     */
    if (!week) {
      week = nextGame.GameWeek;
    }
  } catch (_) {
    /**
     * If the above fails, it's because all games are complete,
     * meaning the season is over.  Just get the highest week
     * number we have and use that.
     */
    week = (await db.selectFrom("Games").select("GameWeek").orderBy(["GameWeek desc"]).executeTakeFirstOrThrow())
      .GameWeek;
  }

  return week;
};
