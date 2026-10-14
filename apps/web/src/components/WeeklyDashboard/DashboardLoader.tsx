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

import { DASHBOARD_CARD, DASHBOARD_ROW } from "@/lib/dashboardGrid";

import ProgressChartLoader from "../ProgressChart/ProgressChartLoader";
import RankingPieChartLoader from "../RankingPieChart/RankingPieChartLoader";
import HandedOffHeading from "../ViewTransitions/HandedOffHeading";
import SharedElement from "../ViewTransitions/SharedElement";

// The view transition names the real dashboard uses at each slot, so the detail pages can morph back into this skeleton
type TransitionNames = {
  gamesChart?: string;
  pointsChart?: string;
  rankingPieChart?: string;
  rankTitle?: string;
  resultsTitle?: string;
};

const RANK_TITLE_CLASS = "mb-0 scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0";
const RESULTS_TITLE_CLASS = "scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0";

type Props = {
  title: string;
  transitionNames?: TransitionNames;
};

const RankTitle: FC<{ name: string | undefined; title: string }> = ({ name, title }) => {
  const heading = <h2 className={RANK_TITLE_CLASS}>{title}</h2>;

  if (name === undefined) {
    return heading;
  }

  return (
    <HandedOffHeading
      className={RANK_TITLE_CLASS}
      fallback={<SharedElement name={name}>{heading}</SharedElement>}
      name={name}
    />
  );
};

const ResultsTitle: FC<{ name: string | undefined }> = ({ name }) => {
  const resultsSkeleton = <Skeleton className="mx-auto h-9 w-[250px] bg-muted" />;

  if (name === undefined) {
    return resultsSkeleton;
  }

  return <HandedOffHeading className={RESULTS_TITLE_CLASS} fallback={resultsSkeleton} name={name} />;
};

const DashboardLoader: FC<Props> = ({ title, transitionNames }) => {
  const names = transitionNames ?? {};

  return (
    <div className={cn("text-center mb-3 md:mb-0 border-b border-border md:border-none px-3", DASHBOARD_CARD)}>
      {/* Named slots show what the page last rendered under the same name, so coming back from a details page the
          titles, ring and bars arrive filled instead of turning into placeholders */}
      <RankTitle name={names.rankTitle} title={title} />
      {/* View Details link */}
      <div className="mb-3 mt-[42px]">
        <Skeleton className="h-[18px] w-[87px] bg-muted" />
      </div>
      {/* Pie Chart */}
      <div className={cn("flex flex-col items-center", DASHBOARD_ROW.chart)}>
        <RankingPieChartLoader transitionName={names.rankingPieChart} />
      </div>
      {/* H2 */}
      <div className={cn("mt-5 md:mt-0", DASHBOARD_ROW.resultsTitle)}>
        <ResultsTitle name={names.resultsTitle} />
      </div>
      {/* Points Bar */}
      <div className={DASHBOARD_ROW.firstBar}>
        <ProgressChartLoader transitionName={names.pointsChart} />
      </div>
      {/* Games Bar */}
      <div className={DASHBOARD_ROW.secondBar}>
        <ProgressChartLoader transitionName={names.gamesChart} />
      </div>
    </div>
  );
};

export default DashboardLoader;
