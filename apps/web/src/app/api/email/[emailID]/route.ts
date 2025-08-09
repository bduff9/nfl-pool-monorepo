/*******************************************************************************
 * NFL Confidence Pool FE - the frontend implementation of an NFL confidence pool.
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

import { DAYS_IN_MONTH, HOURS_IN_DAY, MINUTES_IN_HOUR, SECONDS_IN_MINUTE } from "@nfl-pool-monorepo/utils/constants";

import { addCustomStyling } from "@/lib/strings";
import { getEmail } from "@/server/loaders/email";

export const GET = async (_req: Request, { params }: { params: Promise<{ emailID: string }> }): Promise<Response> => {
  const { emailID } = await params;
  const cacheMaxAge = 6 * DAYS_IN_MONTH * HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE; // 6 months
  const response = new Response();

  response.headers.set("Cache-Control", `max-age=${cacheMaxAge}, s-maxage=${cacheMaxAge}`);

  try {
    const html = await getEmail(emailID);

    if (!html) {
      throw new Error("html content is empty");
    }

    return new Response(`${addCustomStyling(html)}`, {
      headers: {
        "Cache-Control": `max-age=${cacheMaxAge}, s-maxage=${cacheMaxAge}`,
        "Content-Type": "text/html",
      },
      status: 200,
    });
  } catch (error) {
    console.error({ emailID, error, text: "Error retrieving email:" });

    return new Response("<h1>Email not found, please try again later</h1>", {
      headers: {
        "Cache-Control": `max-age=${cacheMaxAge}, s-maxage=${cacheMaxAge}`,
        "Content-Type": "text/html",
      },
      status: 404,
    });
  }
};
