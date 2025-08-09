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
import { motion } from "framer-motion";
import type { FC } from "react";

type ProgressChartProps = {
  correct: number;
  incorrect: number;
  inProgress?: number;
  isOver?: boolean;
  layoutId: string;
  max: number;
  type: "Current Week Remaining" | "Games" | "Overall Remaining" | "Points";
};

const ProgressChart: FC<ProgressChartProps> = ({
  correct,
  incorrect,
  inProgress,
  isOver = false,
  layoutId,
  max,
  type,
}) => {
  const correctPercent = (correct / max) * 100;
  const incorrectPercent = (incorrect / max) * 100;
  const inProgressPercent = ((inProgress ?? 0) / max) * 100;
  let correctLabel = "";
  let incorrectLabel = "";
  let inProgressLabel = "";

  if (type === "Games") {
    correctLabel = "games correct";
    incorrectLabel = "games wrong";
    inProgressLabel = "games not completed yet";
  } else if (type === "Points") {
    correctLabel = "points earned";
    incorrectLabel = "points missed";
    inProgressLabel = "points not completed yet";
  } else if (type === "Current Week Remaining") {
    correctLabel = "players safe this week";
    incorrectLabel = "players went out this week";
    inProgressLabel = "players waiting";
  } else if (type === "Overall Remaining") {
    correctLabel = "players alive";
    incorrectLabel = "players dead";
    inProgressLabel = "players still waiting";
  }

  return (
    <motion.div layoutId={layoutId}>
      <div className="text-start">{type}</div>
      <div className={cn("flex overflow-hidden h-8 text-xs bg-gray-50 rounded-sm")}>
        <div
          aria-label={`${correct} ${correctLabel}`}
          aria-valuemax={max}
          aria-valuemin={0}
          aria-valuenow={correct}
          className={cn(
            "flex flex-col justify-center items-center text-white text-center whitespace-nowrap transition-all bg-green-700",
            !isOver && "in-progress",
          )}
          role="progressbar"
          style={{ width: `${correctPercent}%` }}
          title={`${correct} ${correctLabel}`}
        >
          {correct}
        </div>
        <div
          aria-label={`${incorrect} ${incorrectLabel}`}
          aria-valuemax={max}
          aria-valuemin={0}
          aria-valuenow={incorrect}
          className={cn(
            "flex flex-col justify-center items-center text-white text-center whitespace-nowrap transition-all bg-red-700",
            !isOver && "in-progress",
          )}
          role="progressbar"
          style={{ width: `${incorrectPercent}%` }}
          title={`${incorrect} ${incorrectLabel}`}
        >
          {incorrect}
        </div>
        {typeof inProgress === "number" && (
          <div
            aria-label={`${inProgress} ${inProgressLabel}`}
            aria-valuemax={max}
            aria-valuemin={0}
            aria-valuenow={inProgress}
            className={cn(
              "flex flex-col justify-center items-center text-white text-center whitespace-nowrap transition-all bg-gray-700",
              !isOver && "in-progress",
            )}
            role="progressbar"
            style={{ width: `${inProgressPercent}%` }}
            title={`${inProgress} ${inProgressLabel}`}
          >
            {inProgress}
          </div>
        )}
      </div>
      {["Games", "Points"].includes(type) ? (
        <div className="text-sm flex justify-between mb-2">
          <div>Max possible {type.toLowerCase()}</div>
          <div>{max}</div>
        </div>
      ) : (
        <div className="text-sm flex justify-between mb-2">
          <div>&nbsp;</div>
        </div>
      )}
    </motion.div>
  );
};

export default ProgressChart;
