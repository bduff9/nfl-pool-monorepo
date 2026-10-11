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

import { cn } from "@nfl-pool-monorepo/utils/styles";

type PickStage = "current" | "future" | "past";

type BadgeVariant = "blue" | "success" | "warning";

const PICK_CLASSES: Record<PickStage, string> = {
  current: "cursor-default border-4 text-blue-800 border-blue-400 bg-blue-200",
  future: "cursor-default border-4 text-yellow-800 border-yellow-400 bg-yellow-200",
  past: "cursor-default border-4 text-green-800 border-green-400 bg-green-200",
};

const BADGE_VARIANTS: Record<PickStage, BadgeVariant> = {
  current: "blue",
  future: "warning",
  past: "success",
};

const getPickStage = (pickWeek: number, weekInProgress: null | number): PickStage => {
  const currentWeek = weekInProgress ?? 0;

  if (pickWeek < currentWeek) return "past";

  if (pickWeek === currentWeek) return "current";

  return "future";
};

export const getPickBadgeVariant = (pickWeek: number, weekInProgress: null | number): BadgeVariant =>
  BADGE_VARIANTS[getPickStage(pickWeek, weekInProgress)];

const getOpenTeamClasses = (loading: null | number | undefined, isHome: boolean | undefined): string =>
  cn(
    "border-b border-e border-border bg-muted hover:bg-blue-200 hover:border-blue-400 hover:border-4",
    loading ? "bg-muted grayscale" : "cursor-pointer",
    !isHome && "border-s",
  );

export const getSurvivorTeamStateClasses = (
  pickWeek: number | undefined,
  weekInProgress: null | number,
  isOnBye: boolean | undefined,
  loading: null | number | undefined,
  isHome: boolean | undefined,
): string => {
  if (pickWeek !== undefined) return PICK_CLASSES[getPickStage(pickWeek, weekInProgress)];

  if (isOnBye) return "border border-border bg-muted";

  return getOpenTeamClasses(loading, isHome);
};

export const getSurvivorTeamClasses = (stateClasses: string, isOnBye: boolean | undefined): string =>
  cn(
    stateClasses,
    "relative p-2 text-center h-[152px] flex flex-col items-center justify-center",
    isOnBye ? "w-1/2 md:w-1/4 lg:w-1/6" : "w-1/2",
  );

export const isSurvivorTeamDisabled = (
  hasOnClick: boolean,
  hasPick: boolean,
  loading: null | number | undefined,
): boolean => !hasOnClick || hasPick || !!loading;

export const isTeamLoading = (loading: null | number | undefined, teamID: number | undefined): boolean =>
  loading === teamID;
