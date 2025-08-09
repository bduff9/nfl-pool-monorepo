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
import { ADMIN_USER } from "@nfl-pool-monorepo/utils/constants";
import type { Selectable, Transaction } from "kysely";

import type { ApiMatchup, ApiTeam } from "./zod";

export const getDbGameFromApi = (week: number, homeTeamId: string, visitingTeamId: string) => {
  return db
    .selectFrom("Games as g")
    .innerJoin("Teams as ht", "g.HomeTeamID", "ht.TeamID")
    .innerJoin("Teams as vt", "g.VisitorTeamID", "vt.TeamID")
    .select([
      "g.GameID",
      "g.GameWeek",
      "g.GameNumber",
      "g.GameStatus",
      "g.HomeTeamID",
      "g.VisitorTeamID",
      "g.GameHomeScore",
      "g.GameVisitorScore",
      "g.GameTimeLeftInSeconds",
    ])
    .where("g.GameWeek", "=", week)
    .where("ht.TeamShortName", "=", homeTeamId)
    .where("vt.TeamShortName", "=", visitingTeamId)
    .executeTakeFirstOrThrow();
};

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

export const updateTeamData = async (
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
