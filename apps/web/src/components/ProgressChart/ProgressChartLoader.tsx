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
import type { FC } from "react";

const ProgressChartLoader: FC = () => {
  return (
    <>
      {/* Progress Bar Chart */}
      <div className="text-start">
        <Skeleton className="h-4 w-[75px] bg-gray-300" />
      </div>
      <Skeleton className="h-7 w-full bg-gray-300" />
      <div className="flex justify-between mb-1">
        <Skeleton className="h-2 w-[125px] bg-gray-300" />
        <Skeleton className="h-2 w-[31px] bg-gray-300" />
      </div>
    </>
  );
};

export default ProgressChartLoader;
