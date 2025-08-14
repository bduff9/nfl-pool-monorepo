import { cn } from "@nfl-pool-monorepo/utils/styles";
import { redirect } from "next/navigation";
import type { FC } from "react";

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
import { getCurrentSession } from "@/server/loaders/sessions";
import { getIsAliveInSurvivor, getMySurvivorPickForWeek } from "@/server/loaders/survivor";
import {
  getMySurvivorMv,
  getSurvivorOverallCounts,
  getSurvivorStatus,
  getSurvivorWeeklyCounts,
} from "@/server/loaders/survivorMv";
import { getSelectedWeek, getWeekStatus } from "@/server/loaders/week";

import { ProgressBarLink } from "../ProgressBar/ProgressBar";
import ProgressChart from "../ProgressChart/ProgressChart";
import SurvivorDashboardIcon from "../SurvivorDashboardIcon/SurvivorDashboardIcon";

const SurvivorDashboard: FC = async () => {
  const selectedWeek = await getSelectedWeek();
  const { user } = await getCurrentSession();

  if (!user) {
    return redirect("/auth/login");
  }

  const weekStatusPromise = getWeekStatus(selectedWeek);
  const isAliveInSurvivorPromise = getIsAliveInSurvivor();
  const mySurvivorMvPromise = getMySurvivorMv();
  const mySurvivorPickForWeekPromise = getMySurvivorPickForWeek(selectedWeek);
  const survivorStatusPromise = getSurvivorStatus();
  const survivorOverallCountsPromise = getSurvivorOverallCounts();
  const survivorWeeklyCountsPromise = getSurvivorWeeklyCounts(selectedWeek);

  const [
    weekStatus,
    isAliveInSurvivor,
    mySurvivorMv,
    mySurvivorPickForWeek,
    survivorStatus,
    survivorOverallCounts,
    survivorWeeklyCounts,
  ] = await Promise.all([
    weekStatusPromise,
    isAliveInSurvivorPromise,
    mySurvivorMvPromise,
    mySurvivorPickForWeekPromise,
    survivorStatusPromise,
    survivorOverallCountsPromise,
    survivorWeeklyCountsPromise,
  ]);

  return (
    <div className={cn("text-center mb-3 md:mb-0 px-3")}>
      <h2 className="mb-0 scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">Survivor Pool</h2>

      <div>
        <div>
          {isAliveInSurvivor &&
            (mySurvivorPickForWeek ? (
              <div className="text-green-700">You have submitted your survivor pick</div>
            ) : (
              <div className="text-red-700">You have not submitted your survivor pick yet!</div>
            ))}
          {mySurvivorMv ? (
            <ProgressBarLink className={cn("block underline")} href="/survivor/view">
              View Details
            </ProgressBarLink>
          ) : (
            <div className="md:h-6" />
          )}
          {isAliveInSurvivor && !mySurvivorPickForWeek ? (
            <ProgressBarLink className={cn("block underline md:mb-1")} href="/survivor/set">
              Click here to make your pick
            </ProgressBarLink>
          ) : (
            <div className="md:h-6 md:mb-1" />
          )}
          {!isAliveInSurvivor && <div className="md:h-6" />}
        </div>
        <SurvivorDashboardIcon
          isAlive={isAliveInSurvivor}
          isPlaying={!!user.playsSurvivor}
          lastPick={mySurvivorMv?.lastPickTeam}
          pickForWeek={mySurvivorPickForWeek}
        />

        {survivorStatus !== "Not Started" && (
          <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">Survivor Pool Results</h2>
        )}
        {survivorWeeklyCounts.overallCount > 0 && (
          <ProgressChart
            correct={survivorWeeklyCounts.aliveCount}
            incorrect={survivorWeeklyCounts.deadCount}
            inProgress={survivorWeeklyCounts.waitingCount}
            isOver={weekStatus === "Complete"}
            layoutId="survivorWeekStatus"
            max={survivorWeeklyCounts.overallCount}
            type="Current Week Remaining"
          />
        )}
        {survivorStatus !== "Not Started" && (
          <ProgressChart
            correct={survivorOverallCounts.aliveCount}
            incorrect={survivorOverallCounts.deadCount}
            isOver={survivorStatus === "Complete"}
            layoutId="survivorOverallStatus"
            max={survivorOverallCounts.overallCount}
            type="Overall Remaining"
          />
        )}
      </div>
    </div>
  );
};

export default SurvivorDashboard;
