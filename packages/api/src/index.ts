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

import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { getSystemYear } from "@nfl-pool-monorepo/db/src/queries/systemValue";
import { ZodError } from "zod";

import { type ApiMatchup, EntireSeasonResponseSchema, type NFLWeekArray, SingleWeekResponseSchema } from "./zod";

const callApi = async (year: number, week?: number): Promise<[string, unknown]> => {
  let url = `${process.env.API_HOST}/fflnetdynamic${year}/nfl_sched.json`;

  if (week) {
    url = `${process.env.API_HOST}/fflnetdynamic${year}/nfl_sched_${week}.json`;
  }

  const response = await fetch(url, { headers: { "User-Agent": "ASWNN-NFL Pool" } });

  if (!response.ok) {
    console.error("Error calling API", { response, url, week, year });

    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return [url, await response.json()];
};

export const getEntireSeasonFromApi = async (year?: number): Promise<NFLWeekArray> => {
  if (!year) {
    year = await getSystemYear();
  }

  try {
    const [url, response] = await callApi(year);
    const result = EntireSeasonResponseSchema.parse(response);

    try {
      await db
        .insertInto("ApiCalls")
        .values({
          ApiCallDate: new Date(),
          ApiCallResponse: JSON.stringify(result),
          ApiCallUrl: url,
          ApiCallYear: year,
        })
        .executeTakeFirstOrThrow();
    } catch (error) {
      console.error("Error creating API call record in db for entire season", {
        error,
        year,
      });
    }

    return result.fullNflSchedule.nflSchedule;
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("API returned invalid data for entire season, cannot parse", {
        error,
        year,
      });
    } else {
      console.error("Unexpected error when trying to call API for entire season", {
        error,
        year,
      });
    }

    if (error instanceof Error) {
      try {
        await db
          .insertInto("ApiCalls")
          .values({
            ApiCallDate: new Date(),
            ApiCallError: error.message,
            ApiCallUrl: "",
            ApiCallYear: year,
          })
          .executeTakeFirstOrThrow();
      } catch (error) {
        console.error("Error creating API call record in db for entire season", {
          error,
          year,
        });
      }
    }

    return [];
  }
};

export const getSingleWeekFromApi = async (week: number, year?: number): Promise<Array<ApiMatchup>> => {
  if (!year) {
    year = await getSystemYear();
  }

  try {
    const [url, response] = await callApi(year, week);
    const result = SingleWeekResponseSchema.parse(response);

    try {
      await db
        .insertInto("ApiCalls")
        .values({
          ApiCallDate: new Date(),
          ApiCallResponse: JSON.stringify(result),
          ApiCallUrl: url,
          ApiCallWeek: week,
          ApiCallYear: year,
        })
        .executeTakeFirstOrThrow();
    } catch (error) {
      console.error("Error creating API call record in db for week", {
        error,
        week,
        year,
      });
    }

    return result.nflSchedule.matchup;
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("API returned invalid data for week", {
        error,
        week,
        year,
      });
    } else {
      console.error("Unexpected error when trying to call API for week", {
        error,
        week,
        year,
      });
    }

    if (error instanceof Error) {
      try {
        await db
          .insertInto("ApiCalls")
          .values({
            ApiCallDate: new Date(),
            ApiCallError: error.message,
            ApiCallUrl: "",
            ApiCallWeek: week,
            ApiCallYear: year,
          })
          .executeTakeFirstOrThrow();
      } catch (error) {
        console.error("Error creating API call record in db for week", {
          error,
          week,
          year,
        });
      }
    }

    return [];
  }
};
