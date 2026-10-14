"use client";

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
import { type FC, type ReactNode, Suspense } from "react";

import SharedElement from "@/components/ViewTransitions/SharedElement";
import { progressChartHandoff, useHandedOff } from "@/lib/sharedElementHandoff";

import ProgressChart from "./ProgressChart";

type ProgressChartLoaderProps = {
  // With a name, the slot shows the bar the last page rendered under it (see HandedOffProgressChart) or a named skeleton
  transitionName?: string | undefined;
};

type HandedOffProgressChartProps = {
  fallback: ReactNode;
  name: string;
};

// The bar the last page rendered under this name, filled, so it moves between the pages instead of turning into a
// placeholder and back; the skeleton when there is none (a fresh load, or another week)
const HandedOffProgressChart: FC<HandedOffProgressChartProps> = ({ fallback, name }) => {
  const data = useHandedOff(progressChartHandoff, name);

  return data ? <ProgressChart {...data} transitionName={name} /> : fallback;
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

  const skeleton = (
    <SharedElement name={transitionName}>
      <div>{chart}</div>
    </SharedElement>
  );

  return (
    <Suspense fallback={skeleton}>
      <HandedOffProgressChart fallback={skeleton} name={transitionName} />
    </Suspense>
  );
};

export default ProgressChartLoader;
