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

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nfl-pool-monorepo/ui/components/table";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import CustomHead from "@/components/CustomHead/CustomHead";
import { ProgressBarLink } from "@/components/ProgressBar/ProgressBar";
import ProgressChart from "@/components/ProgressChart/ProgressChart";
import RankingPieChart from "@/components/RankingPieChart/RankingPieChart";
import { WeeklyDashboardResults, WeeklyDashboardTitle } from "@/components/WeeklyDashboard/WeeklyDashboard.client";
import { requireRegistered } from "@/lib/auth";
import type { NP } from "@/lib/types";
import { getCurrentUser } from "@/server/loaders/user";
import { getSelectedWeek, getWeekStatus } from "@/server/loaders/week";
import { getMyWeeklyRank, getWeeklyMvCount, getWeeklyMvTiedCount, getWeeklyRankings } from "@/server/loaders/weeklyMv";

const TITLE = "Weekly Ranks";

export const metadata: Metadata = {
  title: TITLE,
};

const WeeklyRankings: NP = async () => {
  const redirectUrl = await requireRegistered();

  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  const selectedWeek = await getSelectedWeek();

  const weekStatusPromise = getWeekStatus(selectedWeek);
  const weeklyTotalCountPromise = getWeeklyMvCount(selectedWeek);
  const weeklyTiedCountPromise = getWeeklyMvTiedCount(selectedWeek);
  const myWeeklyRankPromise = getMyWeeklyRank(selectedWeek);
  const weeklyRankingsPromise = getWeeklyRankings(selectedWeek);
  const userPromise = getCurrentUser();

  const [weekStatus, weeklyTotalCount, weeklyTiedCount, myWeeklyRank, weeklyRankings, user] = await Promise.all([
    weekStatusPromise,
    weeklyTotalCountPromise,
    weeklyTiedCountPromise,
    myWeeklyRankPromise,
    weeklyRankingsPromise,
    userPromise,
  ]);

  if (weeklyTotalCount === 0) {
    return redirect("/");
  }

  const myPlace = `${myWeeklyRank?.Tied ? "T" : ""}${myWeeklyRank?.Rank}`;
  const me = myWeeklyRank?.Rank ?? 0;
  const aheadOfMe = me - 1;
  const behindMe = weeklyTotalCount - me - weeklyTiedCount;

  return (
    <div className="h-full flex">
      <CustomHead title={`Week ${selectedWeek} Ranks`} />
      <div className="bg-gray-100/80 text-black my-3 mx-2 pt-0 md:pt-3 min-h-screen pb-4 flex-1">
        <div className="flex flex-wrap">
          <div className="hidden md:inline-block w-1/2 text-center h-[205px]">
            <WeeklyDashboardTitle selectedWeek={selectedWeek} />
            <RankingPieChart
              data={[
                {
                  fill: "var(--color-red-700)",
                  myPlace,
                  name: "ahead of me",
                  total: weeklyTotalCount,
                  value: aheadOfMe,
                },
                {
                  fill: "var(--color-green-700)",
                  myPlace,
                  name: "behind me",
                  total: weeklyTotalCount,
                  value: behindMe,
                },
                {
                  fill: "var(--color-amber-600)",
                  myPlace,
                  name: "tied with me",
                  total: weeklyTotalCount,
                  value: weeklyTiedCount,
                },
              ]}
              layoutId="weeklyRankingPieChart"
            />
          </div>
          <div className="mt-4 block md:hidden">
            <ProgressBarLink href="/">&laquo; Back to Dashboard</ProgressBarLink>
          </div>
          <div className="hidden md:inline-block w-1/2 px-3">
            <WeeklyDashboardResults className="mb-4 text-center" selectedWeek={selectedWeek} />
            <ProgressChart
              correct={myWeeklyRank?.PointsEarned ?? 0}
              incorrect={myWeeklyRank?.PointsWrong ?? 0}
              isOver={weekStatus === "Complete"}
              layoutId="weeklyPointsEarned"
              max={myWeeklyRank?.PointsTotal ?? 0}
              type="Points"
            />
            <ProgressChart
              correct={myWeeklyRank?.GamesCorrect ?? 0}
              incorrect={myWeeklyRank?.GamesWrong ?? 0}
              isOver={weekStatus === "Complete"}
              layoutId="weeklyGamesCorrect"
              max={myWeeklyRank?.GamesTotal ?? 0}
              type="Games"
            />
          </div>
          <Table parentClassName="w-full mt-4 text-center">
            <TableHeader>
              <TableRow>
                <TableHead className="text-center text-black font-semibold" scope="col">
                  Rank
                </TableHead>
                <TableHead className="text-center text-black font-semibold" scope="col">
                  Team
                </TableHead>
                <TableHead className="text-center text-black font-semibold" scope="col">
                  Owner
                </TableHead>
                <TableHead className="text-center text-black font-semibold" scope="col">
                  Points
                </TableHead>
                <TableHead className="text-center text-black font-semibold" scope="col">
                  Games Correct
                </TableHead>
                <TableHead className="text-center text-black font-semibold" scope="col">
                  Tiebreaker
                </TableHead>
                <TableHead className="text-center text-black font-semibold" scope="col">
                  Last Game
                </TableHead>
                <TableHead className="text-center text-black font-semibold" scope="col">
                  Eliminated
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeklyRankings.map((row) => (
                <TableRow
                  className={cn(row.UserID === user.UserID && "bg-amber-300")}
                  key={`user-rank-for-${row.UserID}`}
                >
                  <TableHead className="text-center text-black font-semibold" scope="row">
                    {row.Tied ? "T" : ""}
                    {row.Rank}
                  </TableHead>
                  <TableCell>{row.TeamName}</TableCell>
                  <TableCell>{row.UserName}</TableCell>
                  <TableCell>{row.PointsEarned}</TableCell>
                  <TableCell>{row.GamesCorrect}</TableCell>
                  <TableCell>{row.TiebreakerScore}</TableCell>
                  <TableCell>{row.LastScore}</TableCell>
                  <TableCell className="text-red-700">{row.IsEliminated === 1 && <b>X</b>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default WeeklyRankings;
