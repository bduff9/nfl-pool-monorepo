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
import { LuBadgeAlert } from "react-icons/lu";

import CustomHead from "@/components/CustomHead/CustomHead";
import { OverallDashboardResults, OverallDashboardTitle } from "@/components/OverallDashboard/OverallDashboard.client";
import { ProgressBarLink } from "@/components/ProgressBar/ProgressBar";
import ProgressChart from "@/components/ProgressChart/ProgressChart";
import RankingPieChart from "@/components/RankingPieChart/RankingPieChart";
import { requireRegistered } from "@/lib/auth";
import type { NP } from "@/lib/types";
import {
  getMyOverallRank,
  getOverallMvCount,
  getOverallMvTiedCount,
  getOverallRankings,
} from "@/server/loaders/overallMv";
import { getCurrentUser } from "@/server/loaders/user";
import { getSeasonStatus } from "@/server/loaders/week";

const TITLE = "Overall Ranks";

export const metadata: Metadata = {
  title: TITLE,
};

const OverallRankings: NP = async () => {
  const redirectUrl = await requireRegistered();

  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  const seasonStatusPromise = getSeasonStatus();
  const myOverallRankPromise = getMyOverallRank();
  const overallTotalCountPromise = getOverallMvCount();
  const overallTiedCountPromise = getOverallMvTiedCount();
  const overallRankingsPromise = getOverallRankings();
  const userPromise = getCurrentUser();

  const [seasonStatus, myOverallRank, overallTotalCount, overallTiedCount, overallRankings, user] = await Promise.all([
    seasonStatusPromise,
    myOverallRankPromise,
    overallTotalCountPromise,
    overallTiedCountPromise,
    overallRankingsPromise,
    userPromise,
  ]);

  if (overallTotalCount === 0) {
    return redirect("/");
  }

  const myPlace = `${myOverallRank?.Tied ? "T" : ""}${myOverallRank?.Rank}`;
  const me = myOverallRank?.Rank ?? 0;
  const aheadOfMe = me - 1;
  const behindMe = overallTotalCount - me - overallTiedCount;

  return (
    <div className="h-full flex">
      <CustomHead title={TITLE} />
      <div className="bg-gray-100/80 text-black my-3 mx-2 pt-0 md:pt-3 min-h-screen pb-4 flex-1">
        <div className="flex flex-wrap">
          <div className="hidden md:inline-block w-1/2 text-center h-[205px]">
            <OverallDashboardTitle />
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
          </div>
          <div className="mt-4 block md:hidden">
            <ProgressBarLink href="/">&laquo; Back to Dashboard</ProgressBarLink>
          </div>
          <div className="hidden md:inline-block w-1/2 px-3">
            <OverallDashboardResults className="mb-4 text-center" />
            <ProgressChart
              correct={myOverallRank?.PointsEarned ?? 0}
              incorrect={myOverallRank?.PointsWrong ?? 0}
              isOver={seasonStatus === "Complete"}
              layoutId="overallPointsEarned"
              max={myOverallRank?.PointsTotal ?? 0}
              type="Points"
            />
            <ProgressChart
              correct={myOverallRank?.GamesCorrect ?? 0}
              incorrect={myOverallRank?.GamesWrong ?? 0}
              isOver={seasonStatus === "Complete"}
              layoutId="overallGamesCorrect"
              max={myOverallRank?.GamesTotal ?? 0}
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
                  Missed Games?
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overallRankings.map((row) => (
                <tr className={cn(row.UserID === user.UserID && "bg-amber-300")} key={`user-rank-for-${row.UserID}`}>
                  <TableHead className="text-center text-black font-semibold" scope="row">
                    {row.Tied ? "T" : ""}
                    {row.Rank}
                  </TableHead>
                  <TableCell>{row.TeamName}</TableCell>
                  <TableCell>{row.UserName}</TableCell>
                  <TableCell>{row.PointsEarned}</TableCell>
                  <TableCell>{row.GamesCorrect}</TableCell>
                  <TableCell title={`Missed games: ${row.GamesMissed}`}>
                    {row.GamesMissed > 0 && <LuBadgeAlert className="text-red-700 mx-auto size-5" />}
                  </TableCell>
                </tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default OverallRankings;
