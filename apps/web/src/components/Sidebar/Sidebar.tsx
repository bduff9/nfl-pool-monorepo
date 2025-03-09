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
import type { FC } from "react";

import SidebarClient from "./sidebarClient";

import type { User } from "@/lib/auth";
import { getOverallMvCount } from "@/server/loaders/overallMv";
import { getIsAliveInSurvivor } from "@/server/loaders/survivor";
import { getSurvivorOverallCounts } from "@/server/loaders/survivorMv";
import { getMyTiebreaker } from "@/server/loaders/tiebreaker";
import { getCurrentWeek, getSeasonStatus, getSelectedWeek, getWeekStatus } from "@/server/loaders/week";
import { getWeeklyMvCount } from "@/server/loaders/weeklyMv";

type SidebarProps = {
  user: User;
};

const Sidebar: FC<SidebarProps> = async ({ user }) => {
  const currentWeek = await getCurrentWeek();
  const selectedWeek = await getSelectedWeek(currentWeek);

  const isAliveInSurvivorPromise = getIsAliveInSurvivor();
  const tiebreakerPromise = getMyTiebreaker(selectedWeek);
  const seasonStatusPromise = getSeasonStatus();
  const selectedWeekStatusPromise = getWeekStatus(selectedWeek);
  const weeklyMvCountPromise = getWeeklyMvCount(selectedWeek);
  const overallMvCountPromise = getOverallMvCount();
  const survivorMvCountsPromise = getSurvivorOverallCounts();

  const [
    isAliveInSurvivor,
    overallMvCount,
    seasonStatus,
    selectedWeekStatus,
    survivorMvCounts,
    myTiebreaker,
    weeklyMvCount,
  ] = await Promise.all([
    isAliveInSurvivorPromise,
    overallMvCountPromise,
    seasonStatusPromise,
    selectedWeekStatusPromise,
    survivorMvCountsPromise,
    tiebreakerPromise,
    weeklyMvCountPromise,
  ]);

  const hasSeasonStarted = seasonStatus !== "Not Started";

  return (
    <SidebarClient
      currentWeek={currentWeek}
      hasSeasonStarted={hasSeasonStarted}
      isAliveInSurvivor={isAliveInSurvivor}
      myTiebreaker={myTiebreaker}
      overallMvCount={overallMvCount}
      selectedWeek={selectedWeek}
      selectedWeekStatus={selectedWeekStatus}
      survivorMvCount={survivorMvCounts.overallCount}
      user={user}
      weeklyMvCount={weeklyMvCount}
    />
  );
};

export default Sidebar;
