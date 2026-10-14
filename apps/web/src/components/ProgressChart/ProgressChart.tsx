"use client";

import { cn } from "@nfl-pool-monorepo/utils/styles";
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
import type { FC } from "react";

import SharedElement from "@/components/ViewTransitions/SharedElement";

import { getPercent, isPositive, type ProgressChartType, showsMaxPossible } from "./progressChartHelpers";

type ProgressChartProps = {
  correct: number;
  incorrect: number;
  inProgress?: number;
  isOver?: boolean;
  transitionName: string;
  max: number;
  type: ProgressChartType;
};

const LABELS_BY_TYPE: Record<ProgressChartType, { correct: string; inProgress: string; incorrect: string }> = {
  "Current Week Remaining": {
    correct: "players safe this week",
    incorrect: "players went out this week",
    inProgress: "players waiting",
  },
  Games: {
    correct: "games correct",
    incorrect: "games wrong",
    inProgress: "games not completed yet",
  },
  "Overall Remaining": {
    correct: "players alive",
    incorrect: "players dead",
    inProgress: "players still waiting",
  },
  Points: {
    correct: "points earned",
    incorrect: "points missed",
    inProgress: "points not completed yet",
  },
};

type ProgressSegmentProps = {
  colorClass: string;
  isOver: boolean;
  label: string;
  max: number;
  value: number | undefined;
};

const ProgressSegment: FC<ProgressSegmentProps> = ({ colorClass, isOver, label, max, value }) => {
  if (!isPositive(value)) return null;

  return (
    <div
      aria-label={`${value} ${label}`}
      aria-valuemax={max}
      aria-valuemin={0}
      aria-valuenow={value}
      className={cn(
        "flex flex-col justify-center items-center text-white text-center whitespace-nowrap transition-all",
        colorClass,
        !isOver && "in-progress",
      )}
      role="progressbar"
      style={{ width: `${getPercent(value, max)}%` }}
      title={`${value} ${label}`}
    >
      {value}
    </div>
  );
};

const ProgressFooter: FC<{ max: number; type: ProgressChartType }> = ({ max, type }) => {
  if (!showsMaxPossible(type)) {
    return (
      <div className="text-sm flex justify-between mb-2">
        <div>&nbsp;</div>
      </div>
    );
  }

  return (
    <div className="text-sm flex justify-between mb-2">
      <div>Max possible {type.toLowerCase()}</div>
      <div>{max}</div>
    </div>
  );
};

const ProgressChart: FC<ProgressChartProps> = ({
  correct,
  incorrect,
  inProgress,
  isOver = false,
  transitionName,
  max,
  type,
}) => {
  const labels = LABELS_BY_TYPE[type];

  return (
    <SharedElement name={transitionName}>
      <div>
        <div className="text-start">{type}</div>
        <div className={cn("flex overflow-hidden h-8 text-xs bg-muted rounded-sm")}>
          <ProgressSegment colorClass="bg-green-700" isOver={isOver} label={labels.correct} max={max} value={correct} />
          <ProgressSegment
            colorClass="bg-red-700"
            isOver={isOver}
            label={labels.incorrect}
            max={max}
            value={incorrect}
          />
          <ProgressSegment
            colorClass="bg-gray-700"
            isOver={isOver}
            label={labels.inProgress}
            max={max}
            value={inProgress}
          />
        </div>
        <ProgressFooter max={max} type={type} />
      </div>
    </SharedElement>
  );
};

export default ProgressChart;
