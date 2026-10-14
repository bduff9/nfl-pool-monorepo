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

import { cn } from "@nfl-pool-monorepo/utils/styles";
import dynamic from "next/dynamic";
import type { FC } from "react";

import { DASHBOARD_CARD, DASHBOARD_ROW } from "@/lib/dashboardGrid";
import { getMyTiebreaker } from "@/server/loaders/tiebreaker";
import { getWeekStart, getWeekStatus } from "@/server/loaders/week";
import { getMyWeeklyRank, getWeeklyMvCount, getWeeklyMvTiedCount } from "@/server/loaders/weeklyMv";

import ProgressChart from "../ProgressChart/ProgressChart";
import { WeekLink } from "../WeekLink/WeekLink";
import { WeeklyDashboardCountdown, WeeklyDashboardResults, WeeklyDashboardTitle } from "./WeeklyDashboard.client";
import { buildRankingData } from "./weeklyRanking";

const RankingPieChart = dynamic(() => import("../RankingPieChart/RankingPieChart"));

type Props = {
  selectedWeek: number;
};

type MyWeeklyRank = NonNullable<Awaited<ReturnType<typeof getMyWeeklyRank>>>;

const SubmissionStatus: FC<{ hasSubmitted: boolean }> = ({ hasSubmitted }) =>
  hasSubmitted ? (
    <>
      <div className="text-green-600">You have submitted your picks</div>
      <WeekLink className="inline-block py-2.5 underline" data-pressable href="/picks/view">
        View my picks
      </WeekLink>
    </>
  ) : (
    <>
      <div className="text-red-600">You have not submitted your picks yet!</div>
      <WeekLink className="inline-block py-2.5 underline" data-pressable href="/picks/set">
        Make my picks
      </WeekLink>
    </>
  );

const RankDetails: FC<{ hasRank: boolean; weekStart: Date }> = ({ hasRank, weekStart }) =>
  hasRank ? (
    <WeekLink className="inline-block py-2.5 underline" data-pressable href="/weekly">
      View Details
    </WeekLink>
  ) : (
    <WeeklyDashboardCountdown weekStart={weekStart} />
  );

type WeeklyRankChartsProps = {
  isOver: boolean;
  rank: MyWeeklyRank;
  selectedWeek: number;
  tiedCount: number;
  totalCount: number;
};

const WeeklyRankCharts: FC<WeeklyRankChartsProps> = ({ isOver, rank, selectedWeek, tiedCount, totalCount }) => (
  <>
    <div className={DASHBOARD_ROW.chart}>
      <RankingPieChart data={buildRankingData(rank, totalCount, tiedCount)} transitionName="weeklyRankingPieChart" />
    </div>
    {/* Spaced from the pie on phones; on desktop the chart row (as tall as the survivor icon) spaces it */}
    <div className={cn("mt-5 md:mt-0", DASHBOARD_ROW.resultsTitle)}>
      <WeeklyDashboardResults className="" selectedWeek={selectedWeek} />
    </div>
    <div className={DASHBOARD_ROW.firstBar}>
      <ProgressChart
        correct={rank.PointsEarned}
        incorrect={rank.PointsWrong}
        isOver={isOver}
        max={rank.PointsTotal}
        transitionName="weeklyPointsEarned"
        type="Points"
      />
    </div>
    <div className={DASHBOARD_ROW.secondBar}>
      <ProgressChart
        correct={rank.GamesCorrect}
        incorrect={rank.GamesWrong}
        isOver={isOver}
        max={rank.GamesTotal}
        transitionName="weeklyGamesCorrect"
        type="Games"
      />
    </div>
  </>
);

const WeeklyDashboard: FC<Props> = async ({ selectedWeek }) => {
  const myWeeklyRankPromise = getMyWeeklyRank(selectedWeek);
  const myTiebreakerPromise = getMyTiebreaker(selectedWeek);
  const weekStatusPromise = getWeekStatus(selectedWeek);
  const weekStartPromise = getWeekStart(selectedWeek);
  const weeklyTotalCountPromise = getWeeklyMvCount(selectedWeek);
  const weeklyTiedCountPromise = getWeeklyMvTiedCount(selectedWeek);
  const [myWeeklyRank, myTiebreaker, weekStatus, weekStart, weeklyTotalCount, weeklyTiedCount] = await Promise.all([
    myWeeklyRankPromise,
    myTiebreakerPromise,
    weekStatusPromise,
    weekStartPromise,
    weeklyTotalCountPromise,
    weeklyTiedCountPromise,
  ]);

  return (
    <div className={cn("text-center mb-3 md:mb-0 border-b border-border md:border-none px-3", DASHBOARD_CARD)}>
      <WeeklyDashboardTitle selectedWeek={selectedWeek} />
      <div className="flex flex-col">
        <SubmissionStatus hasSubmitted={myTiebreaker?.TiebreakerHasSubmitted === 1} />
        <RankDetails hasRank={myWeeklyRank !== undefined} weekStart={weekStart} />
      </div>
      {!!myWeeklyRank && (
        <WeeklyRankCharts
          isOver={weekStatus === "Complete"}
          rank={myWeeklyRank}
          selectedWeek={selectedWeek}
          tiedCount={weeklyTiedCount}
          totalCount={weeklyTotalCount}
        />
      )}
    </div>
  );
};

export default WeeklyDashboard;
