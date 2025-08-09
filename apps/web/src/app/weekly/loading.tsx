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

import { Skeleton } from "@nfl-pool-monorepo/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nfl-pool-monorepo/ui/components/table";

import { ProgressBarLink } from "@/components/ProgressBar/ProgressBar";
import ProgressChartLoader from "@/components/ProgressChart/ProgressChartLoader";
import RankingPieChartLoader from "@/components/RankingPieChart/RankingPieChartLoader";
import type { NP } from "@/lib/types";

const WeeklyRankingsLoader: NP = () => {
  return (
    <div className="h-full flex">
      <div className="bg-gray-100/80 text-black mx-2 pt-0 md:pt-3 min-h-screen pb-4 flex-1">
        <div className="flex flex-wrap">
          <div className="hidden md:inline-block w-1/2 text-center h-[205px]">
            <h2 className="mb-0">Week Rank</h2>
            <div className="mt-4">
              <RankingPieChartLoader />
            </div>
          </div>
          <div className="mt-4 block md:hidden">
            <ProgressBarLink className="underline" href="/">
              &laquo; Back to Dashboard
            </ProgressBarLink>
          </div>
          <div className="hidden md:inline-block w-1/2 px-3">
            <h2 className="mb-4 text-center">My Week Results</h2>
            <ProgressChartLoader />
            <ProgressChartLoader />
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
              {Array.from({ length: 20 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: This is a loader and the key is not important
                <TableRow key={`table-loader-${i}`}>
                  <TableHead className="text-center text-black font-semibold" scope="row">
                    <Skeleton />
                  </TableHead>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default WeeklyRankingsLoader;
