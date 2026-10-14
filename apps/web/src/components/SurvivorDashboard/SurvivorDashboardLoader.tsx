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

import ProgressChartLoader from "../ProgressChart/ProgressChartLoader";
import SurvivorDashboardIconLoader from "../SurvivorDashboardIcon/SurvivorDashboardIconLoader";

// Laid out like SurvivorDashboard (status line, View Details row, make-pick row, then the icon) so the survivor icon
// and the progress bars sit where the real card puts them and morph to and from /survivor/view without a jump
const SurvivorDashboardLoader: FC = () => (
  <div className="text-center mb-3 md:mb-0 px-3">
    <h2 className="mb-0 scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">Survivor Pool</h2>
    <div className="flex h-6 items-center justify-center md:h-12">
      <Skeleton className="h-4 w-[260px] bg-muted" />
    </div>
    <div className="flex h-11 items-center justify-center">
      <Skeleton className="h-[18px] w-[87px] bg-muted" />
    </div>
    <div className="flex h-11 items-center justify-center md:mb-1">
      <Skeleton className="h-[18px] w-[200px] bg-muted" />
    </div>
    <SurvivorDashboardIconLoader transitionName="survivorIcon" />
    <Skeleton className="mx-auto h-9 w-[250px] bg-muted" />
    <ProgressChartLoader transitionName="survivorWeekStatus" />
    <ProgressChartLoader transitionName="survivorOverallStatus" />
  </div>
);

export default SurvivorDashboardLoader;
