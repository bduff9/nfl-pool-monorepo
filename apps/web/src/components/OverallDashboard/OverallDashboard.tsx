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

import { getMyOverallRank, getOverallMvCount, getOverallMvTiedCount } from "@/server/loaders/overallMv";
import { getSeasonStatus } from "@/server/loaders/week";

import ProgressChart from "../ProgressChart/ProgressChart";
import { WeekLink } from "../WeekLink/WeekLink";
import { OverallDashboardResults, OverallDashboardTitle } from "./OverallDashboard.client";
import { getOverallPieData, getOverallPlacement } from "./overallPlacement";

const RankingPieChart = dynamic(() => import("../RankingPieChart/RankingPieChart"));

type OverallDashboardDetailsProps = {
  myOverallRank: NonNullable<Awaited<ReturnType<typeof getMyOverallRank>>>;
  overallTiedCount: number;
  overallTotalCount: number;
  seasonStatus: Awaited<ReturnType<typeof getSeasonStatus>>;
};

const OverallDashboardDetails: FC<OverallDashboardDetailsProps> = ({
  myOverallRank,
  overallTiedCount,
  overallTotalCount,
  seasonStatus,
}) => {
  const { aheadOfMe, behindMe, myPlace } = getOverallPlacement(myOverallRank, overallTotalCount, overallTiedCount);
  const isOver = seasonStatus === "Complete";

  return (
    <div>
      <div className="mb-12">
        <WeekLink className="inline-block py-2.5 underline" href="/overall">
          View Details
        </WeekLink>
      </div>
      <RankingPieChart
        data={getOverallPieData(myPlace, overallTotalCount, aheadOfMe, behindMe, overallTiedCount)}
        transitionName="overallRankingPieChart"
      />
      <OverallDashboardResults className={cn("mt-5")} />
      <ProgressChart
        correct={myOverallRank.PointsEarned}
        incorrect={myOverallRank.PointsWrong}
        isOver={isOver}
        max={myOverallRank.PointsTotal}
        transitionName="overallPointsEarned"
        type="Points"
      />
      <ProgressChart
        correct={myOverallRank.GamesCorrect}
        incorrect={myOverallRank.GamesWrong}
        isOver={isOver}
        max={myOverallRank.GamesTotal}
        transitionName="overallGamesCorrect"
        type="Games"
      />
    </div>
  );
};

const OverallDashboard: FC = async () => {
  const seasonStatusPromise = getSeasonStatus();
  const myOverallRankPromise = getMyOverallRank();
  const overallTotalCountPromise = getOverallMvCount();
  const overallTiedCountPromise = getOverallMvTiedCount();

  const [seasonStatus, myOverallRank, overallTotalCount, overallTiedCount] = await Promise.all([
    seasonStatusPromise,
    myOverallRankPromise,
    overallTotalCountPromise,
    overallTiedCountPromise,
  ]);

  return (
    <div className={cn("text-center mb-3 md:mb-0 border-b border-border md:border-none px-3")}>
      <OverallDashboardTitle />
      {myOverallRank === undefined ? (
        <div>Season has not started yet!</div>
      ) : (
        <OverallDashboardDetails
          myOverallRank={myOverallRank}
          overallTiedCount={overallTiedCount}
          overallTotalCount={overallTotalCount}
          seasonStatus={seasonStatus}
        />
      )}
    </div>
  );
};

export default OverallDashboard;
