"use client";

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
import { useState } from "react";
import { Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from "recharts";
import type { PieSectorDataItem } from "recharts/types/polar/Pie";
import type { ActiveShape } from "recharts/types/util/types";

type PieChartData = {
  fill: string;
  myPlace: string;
  name: string;
  total: number;
  value: number;
};
type ActiveShapeProps = {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
  payload: PieChartData;
  percent: number;
  value: number;
};

const renderActiveShape: ActiveShape<PieSectorDataItem> = (props: unknown) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props as ActiveShapeProps;

  return (
    <g>
      <text dy={22} fontSize="4rem" textAnchor="middle" x={cx} y={cy}>
        {payload.myPlace}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        endAngle={endAngle}
        fill={fill}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
      />
      <text dy={100} fontSize="1rem" textAnchor="middle" x={cx} y={cy}>
        Out of {payload.total}
      </text>
    </g>
  );
};

type RankingPieChartProps = {
  data: Array<PieChartData>;
  layoutId: string;
};

const RankingPieChart: FC<RankingPieChartProps> = ({ data, layoutId }) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  return (
    <motion.div layoutId={layoutId}>
      <ResponsiveContainer minHeight="205px" width="100%">
        <PieChart height={400} width={400}>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            cx="50%"
            cy="50%"
            data={data}
            dataKey="value"
            innerRadius={60}
            onMouseEnter={onPieEnter}
            outerRadius={80}
          />
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default RankingPieChart;
