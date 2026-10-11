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

export const isLoserOf = (isWinner: boolean, gameStatus: string): boolean => !isWinner && gameStatus === "Final";

const getOutcomeClass = (isWinner: boolean, isLoser: boolean): string | undefined => {
  if (isWinner) return "text-green-600 font-bold";

  return isLoser ? "text-muted-foreground" : undefined;
};

export const getScoreboardTextClasses = (isWinner: boolean, isLoser: boolean, isInRedzone: boolean): string =>
  cn(getOutcomeClass(isWinner, isLoser), isInRedzone && "text-red-600");

export const getLogoClasses = (isLoser: boolean): string => cn("h-auto m-w-full", isLoser && "grayscale");

export const getPossessionClasses = (isInRedzone: boolean): string => cn("me-2", !isInRedzone && "text-amber-800");
