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
import SharedElement from "../ViewTransitions/SharedElement";

// The view transition names the real dashboard uses at each slot, so the detail pages can morph back into this skeleton
type TransitionNames = {
  gamesChart?: string;
  pointsChart?: string;
  rankingPieChart?: string;
  rankTitle?: string;
};

type Props = {
  title: string;
  transitionNames?: TransitionNames;
};

const DashboardLoader: FC<Props> = ({ title, transitionNames }) => {
  const rankTitle = transitionNames?.rankTitle;
  const heading = <h2 className="mb-0 scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">{title}</h2>;

  return (
    <div className={cn("md:w-1/3 text-center mb-3 md:mb-0 border-b border-border md:border-none")}>
      {rankTitle === undefined ? heading : <SharedElement name={rankTitle}>{heading}</SharedElement>}
      {/* View Details link */}
      <div className="mb-3 mt-[42px]">
        <Skeleton className="h-[18px] w-[87px] bg-muted" />
      </div>
      {/* Pie Chart */}
      <RankingPieChartLoader transitionName={transitionNames?.rankingPieChart} />
      {/* H2 */}
      <Skeleton className="mt-5 h-9 w-[250px] bg-muted" />
      {/* Points Bar */}
      <ProgressChartLoader transitionName={transitionNames?.pointsChart} />
      {/* Games Bar */}
      <ProgressChartLoader transitionName={transitionNames?.gamesChart} />
    </div>
  );
};

export default DashboardLoader;
