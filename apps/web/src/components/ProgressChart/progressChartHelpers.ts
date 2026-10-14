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

export type ProgressChartType = "Current Week Remaining" | "Games" | "Overall Remaining" | "Points";

// What a progress chart draws, which is also what it hands to the next page's skeleton (see sharedElementHandoff)
export type ProgressChartData = {
  correct: number;
  incorrect: number;
  inProgress?: number | undefined;
  isOver?: boolean;
  max: number;
  type: ProgressChartType;
};

export const getPercent = (value: number, max: number): number => (max > 0 ? (value / max) * 100 : 0);

export const isPositive = (value: number | undefined): value is number => typeof value === "number" && value > 0;

export const showsMaxPossible = (type: ProgressChartType): boolean => type === "Games" || type === "Points";
