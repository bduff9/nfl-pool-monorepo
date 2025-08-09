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
import type { FC } from "react";

import { getMyOverallRank, getOverallMvCount, getOverallMvTiedCount } from "@/server/loaders/overallMv";
import { getSeasonStatus } from "@/server/loaders/week";

import { ProgressBarLink } from "../ProgressBar/ProgressBar";
import ProgressChart from "../ProgressChart/ProgressChart";
import RankingPieChart from "../RankingPieChart/RankingPieChart";
import { OverallDashboardResults, OverallDashboardTitle } from "./OverallDashboard.client";

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

  const myPlace = `${myOverallRank?.Tied ? "T" : ""}${myOverallRank?.Rank}`;
  const me = myOverallRank?.Rank ?? 0;
  const aheadOfMe = me - 1;
  const behindMe = overallTotalCount - me - overallTiedCount;

  return (
    <div className={cn("text-center mb-3 md:mb-0 border-b border-gray-500 md:border-none px-3")}>
      <OverallDashboardTitle />
      {myOverallRank === undefined ? (
        <div>Season has not started yet!</div>
      ) : (
        <div>
          <div className="mb-12">
            <ProgressBarLink className="md:inline-block underline" href="/overall">
              View Details
            </ProgressBarLink>
          </div>
          <RankingPieChart
            data={[
              {
                fill: "var(--color-red-700)",
                myPlace,
                name: "ahead of me",
                total: overallTotalCount,
                value: aheadOfMe,
              },
              {
                fill: "var(--color-green-700)",
                myPlace,
                name: "behind me",
                total: overallTotalCount,
                value: behindMe,
              },
              {
                fill: "var(--color-amber-600)",
                myPlace,
                name: "tied with me",
                total: overallTotalCount,
                value: overallTiedCount,
              },
            ]}
            layoutId="overallRankingPieChart"
          />
          <OverallDashboardResults className={cn("mt-5")} />
          <ProgressChart
            correct={myOverallRank.PointsEarned}
            incorrect={myOverallRank.PointsWrong}
            isOver={seasonStatus === "Complete"}
            layoutId="overallPointsEarned"
            max={myOverallRank.PointsTotal}
            type="Points"
          />
          <ProgressChart
            correct={myOverallRank.GamesCorrect}
            incorrect={myOverallRank.GamesWrong}
            isOver={seasonStatus === "Complete"}
            layoutId="overallGamesCorrect"
            max={myOverallRank.GamesTotal}
            type="Games"
          />
        </div>
      )}
    </div>
  );
};

export default OverallDashboard;
