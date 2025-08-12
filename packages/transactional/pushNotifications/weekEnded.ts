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

import type { Users } from "@nfl-pool-monorepo/db/src";
import { db } from "@nfl-pool-monorepo/db/src/kysely";
import type { Selectable } from "kysely";

import { sendPushNotification } from ".";

const sendWeekEndedPushNotification = async (
  user: Pick<Selectable<Users>, "UserID" | "UserFirstName">,
  week: number,
): Promise<void> => {
  const homeTeam = await db
    .selectFrom("Teams as t")
    .innerJoin("Games as g", "g.HomeTeamID", "t.TeamID")
    .select([
      "g.GameHomeScore",
      "g.GameVisitorScore",
      "t.TeamCity",
      "t.TeamName",
      "t.TeamPrimaryColor",
      "t.TeamSecondaryColor",
    ])
    .where("g.GameWeek", "=", week)
    .orderBy("GameKickoff", "desc")
    .executeTakeFirstOrThrow();
  const visitorTeam = await db
    .selectFrom("Teams as t")
    .select(["t.TeamCity", "t.TeamName", "t.TeamPrimaryColor", "t.TeamSecondaryColor"])
    .innerJoin("Games as g", "g.VisitorTeamID", "t.TeamID")
    .where("g.GameWeek", "=", week)
    .orderBy("GameKickoff", "desc")
    .executeTakeFirstOrThrow();
  const winnerTeam = await db
    .selectFrom("Teams as t")
    .select(["t.TeamCity", "t.TeamName", "t.TeamPrimaryColor", "t.TeamSecondaryColor"])
    .innerJoin("Games as g", "g.WinnerTeamID", "t.TeamID")
    .where("g.GameWeek", "=", week)
    .orderBy("GameKickoff", "desc")
    .executeTakeFirstOrThrow();
  const [winnerScore, loserScore] =
    homeTeam.GameHomeScore > homeTeam.GameVisitorScore
      ? [homeTeam.GameHomeScore, homeTeam.GameVisitorScore]
      : [homeTeam.GameVisitorScore, homeTeam.GameHomeScore];
  let message = `${user.UserFirstName}, week ${week} has just ended with ${visitorTeam.TeamCity} ${visitorTeam.TeamName} @ ${homeTeam.TeamCity} ${homeTeam.TeamName}. `;

  if (winnerScore === loserScore) {
    message += `The game ended in a tie, ${winnerScore} - ${loserScore}.`;
  } else {
    message += `The ${winnerTeam.TeamName} won with a score of ${winnerScore} - ${loserScore}.`;
  }

  await sendPushNotification(user.UserID, `Week ${week} Just Ended`, message, "weekEnded");
};

export default sendWeekEndedPushNotification;
