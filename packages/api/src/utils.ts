/*******************************************************************************
 * NFL Confidence Pool BE - the backend implementation of an NFL confidence pool.
 * Copyright (C) 2015-present Brian Duffey
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see {http://www.gnu.org/licenses/}.
 * Home: https://asitewithnoname.com/
 */
import type { DB, Games } from "@nfl-pool-monorepo/db/src";
import { db } from "@nfl-pool-monorepo/db/src/kysely";
import type { getDbGameFromApi } from "@nfl-pool-monorepo/db/src/queries/game";
import { ADMIN_USER } from "@nfl-pool-monorepo/utils/constants";
import { differenceInHours } from "date-fns";
import type { Selectable, Transaction } from "kysely";

import type { ApiMatchup, ApiTeam } from "./validation";

export const getGameStatusFromAPI = (game: Pick<ApiMatchup, "quarter" | "status">): Selectable<Games>["GameStatus"] => {
  if (game.status === "SCHED") return "Pregame";

  if (game.status === "FINAL") return "Final";

  if (game.quarter) return game.quarter;

  return "Invalid";
};

/**
 * Get home and visitor teams from API matchup
 * @param teams The matchup from API
 * @throws Error if API matchup does not have 1 home team (isHome === '1') and 1 visiting team (isHome === '0')
 * @returns [Home team, Visiting team]
 */
export const parseTeamsFromApi = (teams: Array<ApiTeam>): [ApiTeam, ApiTeam] => {
  const [visitor, home] = teams.reduce(
    (found, team) => {
      found[+team.isHome] = team;

      return found;
    },
    [null, null] as [ApiTeam | null, ApiTeam | null],
  );

  if (!visitor || !home) {
    throw new Error(`Missing visitor or home from API: ${teams}`);
  }

  return [home, visitor];
};

export const updateTeamDataByShortName = async (
  teamShortName: string,
  team: ApiTeam,
  week: number,
  trx?: Transaction<DB>,
): Promise<void> => {
  const currentData = await (trx ?? db)
    .selectFrom("Teams")
    .select(["TeamPassOffenseRank", "TeamPassDefenseRank", "TeamRushOffenseRank", "TeamRushDefenseRank", "TeamByeWeek"])
    .where("TeamShortName", "=", teamShortName)
    .executeTakeFirstOrThrow();
  const byeWeek = !currentData.TeamByeWeek || currentData.TeamByeWeek === week ? week + 1 : currentData.TeamByeWeek;

  await (trx ?? db)
    .updateTable("Teams")
    .set({
      TeamByeWeek: byeWeek,
      TeamPassDefenseRank: team.passDefenseRank || currentData.TeamPassDefenseRank,
      TeamPassOffenseRank: team.passOffenseRank || currentData.TeamPassOffenseRank,
      TeamRushDefenseRank: team.rushDefenseRank || currentData.TeamRushDefenseRank,
      TeamRushOffenseRank: team.rushOffenseRank || currentData.TeamRushOffenseRank,
      TeamUpdated: new Date(),
      TeamUpdatedBy: ADMIN_USER,
    })
    .where("TeamShortName", "=", teamShortName)
    .executeTakeFirstOrThrow();
};

export const validateAPIData = (game: ApiMatchup, dbGame: Awaited<ReturnType<typeof getDbGameFromApi>>): boolean => {
  const QUARTER_ORDER = [
    "Pregame",
    "1st Quarter",
    "2nd Quarter",
    "Half Time",
    "3rd Quarter",
    "4th Quarter",
    "Overtime",
    "Final",
    "Invalid",
  ] as const;
  const HOURS_TO_WAIT = 10;
  const kickoff = game.kickoff;
  const hoursSinceKickoff = differenceInHours(new Date(), kickoff);
  const [homeTeam, visitingTeam] = parseTeamsFromApi(game.team);

  if (hoursSinceKickoff >= HOURS_TO_WAIT) {
    console.log("Game is outside of waiting period, skip validation...", {
      HOURS_TO_WAIT,
      homeTeam,
      hoursSinceKickoff,
      kickoff,
      visitingTeam,
    });

    return true;
  }

  const homeScoreDB = dbGame.GameHomeScore;
  const homeScoreAPI = +homeTeam.score;

  if (homeScoreAPI < homeScoreDB) {
    console.error("Home score is less than what we had previously: ", {
      homeScoreAPI,
      homeScoreDB,
      homeTeam,
    });

    return false;
  }

  console.log("Home score from API seems valid: ", {
    homeScoreAPI,
    homeScoreDB,
    homeTeam,
  });

  const visitorScoreDB = dbGame.GameVisitorScore;
  const visitorScoreAPI = +visitingTeam.score;

  if (visitorScoreAPI < visitorScoreDB) {
    console.error("Visitor score is less than what we had previously: ", {
      visitingTeam,
      visitorScoreAPI,
      visitorScoreDB,
    });

    return false;
  }

  console.log("Visitor score from API seems valid: ", {
    visitingTeam,
    visitorScoreAPI,
    visitorScoreDB,
  });

  const quarterDB = dbGame.GameStatus;
  const quarterAPI = getGameStatusFromAPI(game);

  if (quarterAPI === "Final" && homeScoreAPI === visitorScoreAPI) {
    console.error(`End score is tied at ${homeScoreAPI}-${visitorScoreAPI}, mistake? `, {
      HOURS_TO_WAIT,
      homeScoreAPI,
      hoursSinceKickoff,
      kickoff,
      quarterAPI,
      visitorScoreAPI,
    });

    return false;
  }

  const quarterIndexDB = QUARTER_ORDER.indexOf(quarterDB);
  const quarterIndexAPI = QUARTER_ORDER.indexOf(quarterAPI);

  if (quarterIndexAPI === quarterIndexDB) {
    const timeLeftDB = dbGame.GameTimeLeftInSeconds;
    const timeLeftAPI = +game.gameSecondsRemaining;

    if (timeLeftAPI > timeLeftDB) {
      console.error("Time left is greater in API than what we had in DB: ", {
        quarterAPI,
        quarterDB,
        timeLeftAPI,
        timeLeftDB,
      });

      return false;
    }

    console.log("Time left from API seems valid: ", {
      quarterAPI,
      quarterDB,
      timeLeftAPI,
      timeLeftDB,
    });
  } else if (quarterIndexAPI < quarterIndexDB) {
    console.error("Quarter from API is earlier than what we have in DB: ", {
      QUARTER_ORDER,
      quarterAPI,
      quarterDB,
      quarterIndexAPI,
      quarterIndexDB,
    });

    return false;
  }

  console.log("Quarter from API seems valid: ", {
    QUARTER_ORDER,
    quarterAPI,
    quarterDB,
    quarterIndexAPI,
    quarterIndexDB,
  });

  return true;
};
