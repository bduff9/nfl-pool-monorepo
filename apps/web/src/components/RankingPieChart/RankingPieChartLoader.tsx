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

type RankingPieChartLoaderProps = {
  // Only the detail-page loaders pass this; the dashboard loader renders the same skeleton without a name
  transitionName?: string;
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

  return (
    <SharedElement name={transitionName}>
      <div className="min-h-[206px] w-full">{chart}</div>
    </SharedElement>
  );
};

export default RankingPieChartLoader;
