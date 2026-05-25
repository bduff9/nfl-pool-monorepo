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
import { Customized, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type PieChartData = {
  fill: string;
  myPlace: string;
  name: string;
  total: number;
  value: number;
};

type RankingPieChartProps = {
  data: Array<PieChartData>;
  layoutId: string;
};

const CenterLabel: FC<{ data: Array<PieChartData> }> = ({ data }) => {
  const item = data[0];

  if (!item) return null;

  return (
    <g style={{ pointerEvents: "none" }}>
      <text dy={22} fontSize="4rem" textAnchor="middle" x="50%" y="50%">
        {item.myPlace}
      </text>
      <text dy={100} fontSize="1rem" textAnchor="middle" x="50%" y="50%">
        Out of {item.total}
      </text>
    </g>
  );
};

const RankingPieChart: FC<RankingPieChartProps> = ({ data, layoutId }) => {
  const initialIndex = data.findIndex((d) => d.value > 0);

  return (
    <motion.div layoutId={layoutId}>
      <ResponsiveContainer minHeight="206px" width="100%">
        <PieChart height={400} width={400}>
          <Pie cx="50%" cy="50%" data={data} dataKey="value" innerRadius={60} outerRadius={80} />
          <Customized component={() => <CenterLabel data={data} />} />
          <Tooltip defaultIndex={initialIndex} />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default RankingPieChart;
