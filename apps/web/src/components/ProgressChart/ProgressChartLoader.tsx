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

import SharedElement from "@/components/ViewTransitions/SharedElement";

type ProgressChartLoaderProps = {
  // Only the detail-page loaders pass this; the dashboard loader renders the same skeleton without a name
  transitionName?: string | undefined;
};

const ProgressChartLoader: FC<ProgressChartLoaderProps> = ({ transitionName }) => {
  const chart = (
    <>
      {/* Progress Bar Chart */}
      {/* As tall as ProgressChart's label line, bar and footer line, so the skeleton and the chart line up */}
      <div className="flex h-6 items-center">
        <Skeleton className="h-4 w-[75px] bg-muted" />
      </div>
      <Skeleton className="h-8 w-full bg-muted" />
      <div className="flex h-5 items-center justify-between mb-2">
        <Skeleton className="h-2 w-[125px] bg-muted" />
        <Skeleton className="h-2 w-[31px] bg-muted" />
      </div>
    </>
  );

  if (!transitionName) {
    return chart;
  }

  return (
    <SharedElement name={transitionName}>
      <div>{chart}</div>
    </SharedElement>
  );
};

export default ProgressChartLoader;
