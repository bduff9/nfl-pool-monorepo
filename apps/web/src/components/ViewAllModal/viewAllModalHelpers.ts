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

import type { getGamesForWeek } from "@nfl-pool-monorepo/db/src/queries/game";
import { cn } from "@nfl-pool-monorepo/utils/styles";

import { getAbbreviation } from "@/lib/strings";

export type WinnerTeam = Awaited<ReturnType<typeof getGamesForWeek>>[number]["visitorTeam"];

export const getWinnerButtonClasses = (isSelected: boolean): string =>
  cn(
    "rounded-full size-[90px] mx-auto border-0 p-0",
    isSelected
      ? "cursor-default bg-blue-300 border-blue-500 border-4"
      : "cursor-pointer hover:bg-blue-100 hover:border-blue-300 hover:border-4 hover:text-blue-900",
  );

export const getWinnerTeamDisplay = (team: WinnerTeam) => {
  const { TeamCity, TeamLogo, TeamName }: Partial<NonNullable<WinnerTeam>> = team ?? {};

  return {
    fullName: `${TeamCity} ${TeamName}`,
    label: TeamName?.includes(" ") ? getAbbreviation(TeamName) : TeamName,
    logoSrc: `/NFLLogos/${TeamLogo}`,
  };
};
