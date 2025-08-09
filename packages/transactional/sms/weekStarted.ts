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

import { sendSMS } from ".";

const sendWeekStartedSMS = async (
  user: Pick<Selectable<Users>, "UserPhone" | "UserFirstName">,
  week: number,
): Promise<void> => {
  const homeTeam = await db
    .selectFrom("Teams as t")
    .select(["t.TeamCity", "t.TeamName"])
    .innerJoin("Games as g", "g.HomeTeamID", "t.TeamID")
    .where("g.GameWeek", "=", week)
    .where("g.GameNumber", "=", 1)
    .executeTakeFirstOrThrow();
  const visitorTeam = await db
    .selectFrom("Teams as t")
    .select(["t.TeamCity", "t.TeamName"])
    .innerJoin("Games as g", "g.VisitorTeamID", "t.TeamID")
    .where("g.GameWeek", "=", week)
    .where("g.GameNumber", "=", 1)
    .executeTakeFirstOrThrow();
  const message = `${user.UserFirstName}, week ${week} has just started with ${visitorTeam.TeamCity} ${visitorTeam.TeamName} @ ${homeTeam.TeamCity} ${homeTeam.TeamName}`;

  try {
    if (!user.UserPhone) {
      throw new Error("Missing phone number for user!");
    }

    await sendSMS(user.UserPhone, message, "weekStarted");
  } catch (error) {
    console.error("Failed to send week started sms: ", {
      error,
      homeTeam,
      message,
      type: "weekStarted",
      user,
      visitorTeam,
      week,
    });
  }
};

export default sendWeekStartedSMS;
