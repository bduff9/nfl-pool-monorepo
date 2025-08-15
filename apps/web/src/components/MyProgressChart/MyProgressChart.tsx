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
import type { FC } from "react";

type MyProgressChartProps = {
  correct: number;
  correctLabel: string;
  isOver?: boolean;
  max: number;
  maxLabel: string;
  possible: number;
  possibleLabel: string;
};

const MyProgressChart: FC<MyProgressChartProps> = ({
  correct,
  correctLabel,
  isOver = false,
  max,
  maxLabel,
  possible,
  possibleLabel,
}) => {
  const correctPercent = (correct / max) * 100;
  const possiblePercent = ((possible - correct) / max) * 100;

  return (
    <div>
      <div className="text-end text-muted">{max}</div>
      <div className="mb-2 h-8 flex overflow-hidden text-xs bg-gray-50 rounded-sm">
        <div
          aria-valuemax={max}
          aria-valuemin={0}
          aria-valuenow={correct}
          className={cn(
            "flex flex-col justify-center items-center text-green-100 text-center whitespace-nowrap transition-all  bg-green-700",
            !isOver && "in-progress",
          )}
          role="progressbar"
          style={{ width: `${correctPercent}%` }}
        >
          {correct}
        </div>
        {possible !== correct && (
          <div
            aria-valuemax={max}
            aria-valuemin={0}
            aria-valuenow={possible}
            className={cn(
              "flex flex-col justify-center items-center text-green-900 text-center whitespace-nowrap transition-all bg-green-300",
              !isOver && "in-progress",
            )}
            role="progressbar"
            style={{ width: `${possiblePercent}%` }}
          >
            {possible}
          </div>
        )}
      </div>
      <div className="text-xs flex justify-between pb-1">
        <div>
          <div className="inline-block w-4 h-4 bg-green-700"></div> {correctLabel}
        </div>
        <div>
          <div className="inline-block w-4 h-4 bg-green-300"></div> {possibleLabel}
        </div>
        <div>
          <div className="inline-block w-4 h-4 bg-gray-50"></div> {maxLabel}
        </div>
      </div>
    </div>
  );
};

export default MyProgressChart;
