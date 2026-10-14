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
import { rankingPieChartHandoff, useHandedOff } from "@/lib/sharedElementHandoff";

import RankingPieChart from "./RankingPieChart";

type RankingPieChartLoaderProps = {
  // With a name, the slot shows the ring the last page rendered under it (see HandedOffRankingPieChart) or a named
  // skeleton
  transitionName?: string | undefined;
};

type HandedOffRankingPieChartProps = {
  fallback: ReactNode;
  name: string;
};

// The ring the last page rendered under this name, complete, so it moves between the pages instead of turning into a
// placeholder and back; the skeleton when there is none (a fresh load, or another week)
const HandedOffRankingPieChart: FC<HandedOffRankingPieChartProps> = ({ fallback, name }) => {
  const data = useHandedOff(rankingPieChartHandoff, name);

  return data ? <RankingPieChart data={data} transitionName={name} /> : fallback;
};

const RankingPieChartLoader: FC<RankingPieChartLoaderProps> = ({ transitionName }) => {
  const chart = (
    <>
      {/* Pie Chart */}
      <div>
        <Skeleton className="h-40 w-40 rounded-full bg-muted" />
      </div>
      <div className="mt-2">
        <Skeleton className="h-[19px] w-[66px] bg-muted" />
      </div>
    </>
  );

  if (!transitionName) {
    return chart;
  }

  const skeleton = (
    <SharedElement name={transitionName}>
      <div className="min-h-[206px] w-full">{chart}</div>
    </SharedElement>
  );

  return (
    <Suspense fallback={skeleton}>
      <HandedOffRankingPieChart fallback={skeleton} name={transitionName} />
    </Suspense>
  );
};

export default RankingPieChartLoader;
