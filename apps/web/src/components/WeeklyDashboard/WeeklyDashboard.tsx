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

import { ProgressBarLink } from "../ProgressBar/ProgressBar";
import ProgressChart from "../ProgressChart/ProgressChart";
import RankingPieChart from "../RankingPieChart/RankingPieChart";

import { WeeklyDashboardCountdown, WeeklyDashboardResults, WeeklyDashboardTitle } from "./WeeklyDashboard.client";

import { getMyTiebreaker } from "@/server/loaders/tiebreaker";
import { getSelectedWeek, getWeekStart, getWeekStatus } from "@/server/loaders/week";
import { getMyWeeklyRank, getWeeklyMvCount, getWeeklyMvTiedCount } from "@/server/loaders/weeklyMv";
import { cn } from "@nfl-pool-monorepo/utils/styles";

const WeeklyDashboard: FC = async () => {
  const selectedWeek = await getSelectedWeek();

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

  const myPlace = `${myWeeklyRank?.Tied ? "T" : ""}${myWeeklyRank?.Rank}`;
  const me = myWeeklyRank?.Rank ?? 0;
  const aheadOfMe = me - 1;
  const behindMe = weeklyTotalCount - me - weeklyTiedCount;

  return (
    <div className={cn("col-md-4 text-center mb-3 md:mb-0")}>
      <WeeklyDashboardTitle selectedWeek={selectedWeek} />
      <div>
        {myTiebreaker.TiebreakerHasSubmitted ? (
          <>
            <div className="text-success">You have submitted your picks</div>
            <ProgressBarLink href="/picks/view">View my picks</ProgressBarLink>
          </>
        ) : (
          <>
            <div className="text-danger">You have not submitted your picks yet!</div>
            <ProgressBarLink href="/picks/set">Make my picks</ProgressBarLink>
          </>
        )}
        {myWeeklyRank === undefined ? (
          <WeeklyDashboardCountdown weekStart={weekStart} />
        ) : (
          <ProgressBarLink href="/weekly" className="d-block">
            View Details
          </ProgressBarLink>
        )}
      </div>
      {myWeeklyRank && (
        <div>
          <RankingPieChart
            data={[
              {
                fill: "var(--bs-danger)",
                myPlace,
                name: "ahead of me",
                total: weeklyTotalCount,
                value: aheadOfMe,
              },
              {
                fill: "var(--bs-success)",
                myPlace,
                name: "behind me",
                total: weeklyTotalCount,
                value: behindMe,
              },
              {
                fill: "var(--bs-warning)",
                myPlace,
                name: "tied with me",
                total: weeklyTotalCount,
                value: weeklyTiedCount,
              },
            ]}
            layoutId="weeklyRankingPieChart"
          />
          <WeeklyDashboardResults className={cn("mt-5")} selectedWeek={selectedWeek} />
          <ProgressChart
            correct={myWeeklyRank.PointsEarned}
            incorrect={myWeeklyRank.PointsWrong}
            isOver={weekStatus === "Complete"}
            layoutId="weeklyPointsEarned"
            max={myWeeklyRank.PointsTotal}
            type="Points"
          />
          <ProgressChart
            correct={myWeeklyRank.GamesCorrect}
            incorrect={myWeeklyRank.GamesWrong}
            isOver={weekStatus === "Complete"}
            layoutId="weeklyGamesCorrect"
            max={myWeeklyRank.GamesTotal}
            type="Games"
          />
        </div>
      )}
    </div>
  );
};

export default WeeklyDashboard;
