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

import SharedElement from "../ViewTransitions/SharedElement";

type SurvivorDashboardIconLoaderProps = {
  transitionName: string;
};

// The same 206px icon and overlapping heading line as SurvivorDashboardIcon, so the icon morphs into and out of its
// skeleton without changing size
const SurvivorDashboardIconLoader: FC<SurvivorDashboardIconLoaderProps> = ({ transitionName }) => (
  <SharedElement name={transitionName}>
    <div className="mx-auto w-[206px]">
      <Skeleton className="size-[206px] rounded-full bg-muted" />
      <div className="relative -mt-4 flex h-8 items-end justify-center">
        <Skeleton className="h-5 w-[160px] bg-muted" />
      </div>
    </div>
  </SharedElement>
);

export default SurvivorDashboardIconLoader;
