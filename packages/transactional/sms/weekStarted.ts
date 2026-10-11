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
import type { Selectable } from "kysely";

import { getFirstGameTeams, getWeekStartedMessage } from "../src/weekTeams";
import { sendSMS } from ".";

const sendWeekStartedSMS = async (
  user: Pick<Selectable<Users>, "UserPhone" | "UserFirstName">,
  week: number,
): Promise<void> => {
  const teams = await getFirstGameTeams(week);
  const message = getWeekStartedMessage(user.UserFirstName, week, teams);

  try {
    if (!user.UserPhone) {
      throw new Error("Missing phone number for user!");
    }

    await sendSMS(user.UserPhone, message, "weekStarted");
  } catch (error) {
    console.error("Failed to send week started sms: ", {
      error,
      ...teams,
      message,
      type: "weekStarted",
      user,
      week,
    });
  }
};

export default sendWeekStartedSMS;
