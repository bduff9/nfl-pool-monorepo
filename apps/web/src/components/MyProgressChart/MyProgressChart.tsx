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

import { getBarClassName, toPercent } from "./progressBar";

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
  const correctPercent = toPercent(correct, max);
  const possiblePercent = toPercent(possible - correct, max);

  return (
    <div>
      <div className="text-end text-muted-foreground">{max}</div>
      <div className="mb-2 h-8 flex overflow-hidden text-xs bg-muted rounded-sm">
        <div
          aria-valuemax={max}
          aria-valuemin={0}
          aria-valuenow={correct}
          className={getBarClassName(
            "progress-fill flex flex-col justify-center items-center text-green-100 text-center whitespace-nowrap transition-all bg-green-700",
            isOver,
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
            className={getBarClassName(
              "progress-fill flex flex-col justify-center items-center text-green-900 text-center whitespace-nowrap transition-all bg-green-300",
              isOver,
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
          <div className="inline-block w-4 h-4 bg-muted"></div> {maxLabel}
        </div>
      </div>
    </div>
  );
};

export default MyProgressChart;
