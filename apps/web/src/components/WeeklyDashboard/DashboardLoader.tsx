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
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { FC } from "react";

import ProgressChartLoader from "../ProgressChart/ProgressChartLoader";
import RankingPieChartLoader from "../RankingPieChart/RankingPieChartLoader";

type Props = {
  title: string;
};

const DashboardLoader: FC<Props> = ({ title }) => {
  return (
    <div className={cn("md:w-1/3 text-center mb-3 md:mb-0 border-b border-gray-500 md:border-none")}>
      <h2 className="mb-0">{title}</h2>
      {/* View Details link */}
      <div className="mb-3 mt-[42px]">
        <Skeleton className="h-[18px] w-[87px] bg-gray-300" />
      </div>
      {/* Pie Chart */}
      <RankingPieChartLoader />
      {/* H2 */}
      <Skeleton className="mt-5 h-9 w-[250px] bg-gray-300" />
      {/* Points Bar */}
      <ProgressChartLoader />
      {/* Games Bar */}
      <ProgressChartLoader />
    </div>
  );
};

export default DashboardLoader;
