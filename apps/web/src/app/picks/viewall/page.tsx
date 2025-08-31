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

import "server-only";

import { getGamesForWeek } from "@nfl-pool-monorepo/db/src/queries/game";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { FC } from "react";

import CustomHead from "@/components/CustomHead/CustomHead";
import { requireRegistered } from "@/lib/auth";
import { getAllPicksForWeek } from "@/server/loaders/pick";
import { getMyTiebreaker } from "@/server/loaders/tiebreaker";
import { getCurrentUser } from "@/server/loaders/user";
import { getSelectedWeek } from "@/server/loaders/week";
import { getWeeklyRankings } from "@/server/loaders/weeklyMv";

import ViewAllPicksClient from "./viewall.client";

const TITLE = "View All Week Picks";

export const metadata: Metadata = {
  title: TITLE,
};

const ViewAllPicks: FC<PageProps<"/picks/viewall">> = async () => {
  const redirectUrl = await requireRegistered();

  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  const selectedWeek = await getSelectedWeek();
  const currentUser = await getCurrentUser();
  const tiebreakerPromise = getMyTiebreaker(selectedWeek);
  const weeklyRankingsPromise = getWeeklyRankings(selectedWeek);
  const gamesForWeekPromise = getGamesForWeek(selectedWeek);
  const picksForWeekPromise = getAllPicksForWeek(selectedWeek);

  const [tiebreaker, weeklyRankings, gamesForWeek, picksForWeek] = await Promise.all([
    tiebreakerPromise,
    weeklyRankingsPromise,
    gamesForWeekPromise,
    picksForWeekPromise,
  ]);

  if (tiebreaker?.TiebreakerHasSubmitted !== 1) {
    return redirect("/picks/set");
  }

  if (weeklyRankings.length === 0) {
    return redirect("/picks/view");
  }

  return (
    <div className="h-full flex flex-wrap md:mx-3">
      <CustomHead title={`View all week ${selectedWeek} picks`} />
      <div className={cn("bg-gray-100/80 text-black pt-3 flex-1 min-h-screen")}>
        <ViewAllPicksClient
          currentUserId={currentUser.UserID}
          gamesForWeek={gamesForWeek}
          key={`view-all-for-week-${selectedWeek}`}
          picksForWeek={picksForWeek}
          weeklyRankings={weeklyRankings}
        />
      </div>
    </div>
  );
};

export default ViewAllPicks;
