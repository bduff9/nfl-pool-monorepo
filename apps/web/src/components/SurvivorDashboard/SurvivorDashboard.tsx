import { cn } from "@nfl-pool-monorepo/utils/styles";
import { redirect } from "next/navigation";
import type { FC } from "react";

import { DASHBOARD_CARD, DASHBOARD_ROW } from "@/lib/dashboardGrid";
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
import { getWeekStatus } from "@/server/loaders/week";

import ProgressChart from "../ProgressChart/ProgressChart";
import SurvivorDashboardIcon from "../SurvivorDashboardIcon/SurvivorDashboardIcon";
import { WeekLink } from "../WeekLink/WeekLink";

type Props = {
  selectedWeek: number;
};

type SurvivorStatus = Awaited<ReturnType<typeof getSurvivorStatus>>;
type WeeklyCounts = Awaited<ReturnType<typeof getSurvivorWeeklyCounts>>;
type OverallCounts = Awaited<ReturnType<typeof getSurvivorOverallCounts>>;

const PickStatusMessage: FC<{ hasPick: boolean; isAlive: boolean }> = ({ hasPick, isAlive }) => {
  if (!isAlive) {
    return null;
  }

  return hasPick ? (
    <div className="text-green-700 md:min-h-12">You have submitted your survivor pick</div>
  ) : (
    <div className="text-red-700 md:min-h-12">You have not submitted your survivor pick yet!</div>
  );
};

// On desktop the status line reserves two lines (the longer message wraps in a third-width column) and the placeholders
// are as tall as the links they stand in for, so the icon sits at the same height in every state and
// SurvivorDashboardLoader can put its skeleton exactly there
const ViewDetailsLink: FC<{ hasSurvivorMv: boolean }> = ({ hasSurvivorMv }) =>
  hasSurvivorMv ? (
    <WeekLink className={cn("block py-2.5 underline")} href="/survivor/view">
      View Details
    </WeekLink>
  ) : (
    <div className="md:h-11" />
  );

const MakePickLink: FC<{ hasPick: boolean; isAlive: boolean }> = ({ hasPick, isAlive }) =>
  isAlive && !hasPick ? (
    <WeekLink className={cn("block py-2.5 underline md:mb-1")} href="/survivor/set">
      Click here to make your pick
    </WeekLink>
  ) : (
    <div className="md:h-11 md:mb-1" />
  );

type SurvivorResultsProps = {
  overallCounts: OverallCounts;
  survivorStatus: SurvivorStatus;
  weekStatus: Awaited<ReturnType<typeof getWeekStatus>>;
  weeklyCounts: WeeklyCounts;
};

const SurvivorResults: FC<SurvivorResultsProps> = ({ overallCounts, survivorStatus, weekStatus, weeklyCounts }) => {
  const hasStarted = survivorStatus !== "Not Started";

  return (
    <>
      {hasStarted && (
        <h2 className={cn("scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0", DASHBOARD_ROW.resultsTitle)}>
          Survivor Pool Results
        </h2>
      )}
      {weeklyCounts.overallCount > 0 && (
        <div className={DASHBOARD_ROW.firstBar}>
          <ProgressChart
            correct={weeklyCounts.aliveCount}
            incorrect={weeklyCounts.deadCount}
            inProgress={weeklyCounts.waitingCount}
            isOver={weekStatus === "Complete"}
            max={weeklyCounts.overallCount}
            transitionName="survivorWeekStatus"
            type="Current Week Remaining"
          />
        </div>
      )}
      {hasStarted && (
        <div className={DASHBOARD_ROW.secondBar}>
          <ProgressChart
            correct={overallCounts.aliveCount}
            incorrect={overallCounts.deadCount}
            isOver={survivorStatus === "Complete"}
            max={overallCounts.overallCount}
            transitionName="survivorOverallStatus"
            type="Overall Remaining"
          />
        </div>
      )}
    </>
  );
};

const SurvivorDashboard: FC<Props> = async ({ selectedWeek }) => {
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
    <div className={cn("text-center mb-3 md:mb-0 px-3", DASHBOARD_CARD)}>
      <h2 className="mb-0 scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">Survivor Pool</h2>
      <div>
        <PickStatusMessage hasPick={!!mySurvivorPickForWeek} isAlive={!!isAliveInSurvivor} />
        <ViewDetailsLink hasSurvivorMv={!!mySurvivorMv} />
        <MakePickLink hasPick={!!mySurvivorPickForWeek} isAlive={!!isAliveInSurvivor} />
        {!isAliveInSurvivor && <div className="md:h-12" />}
      </div>
      <div className={DASHBOARD_ROW.chart}>
        <SurvivorDashboardIcon
          isAlive={isAliveInSurvivor}
          isPlaying={!!user.playsSurvivor}
          lastPick={mySurvivorMv?.lastPickTeam}
          pickForWeek={mySurvivorPickForWeek}
          transitionName="survivorIcon"
        />
      </div>
      <SurvivorResults
        overallCounts={survivorOverallCounts}
        survivorStatus={survivorStatus}
        weeklyCounts={survivorWeeklyCounts}
        weekStatus={weekStatus}
      />
    </div>
  );
};

export default SurvivorDashboard;
