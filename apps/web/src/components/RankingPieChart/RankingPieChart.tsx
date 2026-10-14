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

import type { FC } from "react";
// react-doctor-disable-next-line prefer-dynamic-import -- both consumers (OverallDashboard, WeeklyDashboard) already load this whole component via next/dynamic, so recharts is already code-split
import { Pie, PieChart, ResponsiveContainer, Sector, Tooltip, useChartHeight, useChartWidth } from "recharts";

import SharedElement from "@/components/ViewTransitions/SharedElement";
import { useHasNavigated } from "@/lib/hooks/useHasNavigated";
import { rankingPieChartHandoff, useRememberHandoff } from "@/lib/sharedElementHandoff";

import type { PieChartData } from "./rankingPieChartData";

type RankingPieChartProps = {
  data: Array<PieChartData>;
  transitionName: string;
};

const CHART_HEIGHT = 206;
const INNER_RADIUS = 60;
const OUTER_RADIUS = 80;
// Recharts' default sector outline
const SECTOR_STROKE = "#fff";

const CenterText: FC<{ item: PieChartData | undefined; x: number; y: number }> = ({ item, x, y }) => {
  if (!item) return null;

  return (
    <g style={{ pointerEvents: "none" }}>
      <text className="fill-black dark:fill-white" dy={22} fontSize="4rem" textAnchor="middle" x={x} y={y}>
        {item.myPlace}
      </text>
      <text className="fill-black dark:fill-white" dy={100} fontSize="1rem" textAnchor="middle" x={x} y={y}>
        Out of {item.total}
      </text>
    </g>
  );
};

const CenterLabel: FC<{ data: Array<PieChartData> }> = ({ data }) => {
  const width = useChartWidth();
  const height = useChartHeight();

  return <CenterText item={data[0]} x={(width ?? 0) / 2} y={(height ?? 0) / 2} />;
};

type RingSector = {
  endAngle: number;
  item: PieChartData;
  startAngle: number;
};

// Each item's slice of the ring, laid out like Recharts' Pie with its default angles: counter-clockwise from 3 o'clock,
// in data order, sized by value
const getRingSectors = (data: Array<PieChartData>): Array<RingSector> => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  let startAngle = 0;

  return data.map((item) => {
    const sector = { endAngle: startAngle + (total ? item.value / total : 0) * 360, item, startAngle };

    startAngle = sector.endAngle;

    return sector;
  });
};

// The finished ring and its label as plain SVG, the same shapes Recharts draws, centred in the same box. Recharts only
// draws its sectors after its effects have measured the chart, a frame after it mounts, which is after a view
// transition has captured the page; this is there in the first commit, so the ring arriving on a page is complete.
const StaticRing: FC<{ data: Array<PieChartData> }> = ({ data }) => {
  return (
    <svg aria-hidden="true" className="absolute top-0 left-0" height={CHART_HEIGHT} width="100%">
      <svg aria-hidden="true" overflow="visible" x="50%" y="50%">
        {getRingSectors(data).map(({ endAngle, item, startAngle }) => (
          <Sector
            cx={0}
            cy={0}
            endAngle={endAngle}
            fill={item.fill}
            innerRadius={INNER_RADIUS}
            key={item.name}
            outerRadius={OUTER_RADIUS}
            startAngle={startAngle}
            stroke={SECTOR_STROKE}
          />
        ))}
        <CenterText item={data[0]} x={0} y={0} />
      </svg>
    </svg>
  );
};

const RankingPieChart: FC<RankingPieChartProps> = ({ data, transitionName }) => {
  // The ring sweeps open on a fresh load only. After a client navigation it is already drawn, so it moves with its page
  // or morphs from the other page's ring instead of being redrawn there. "auto" keeps Recharts' reduced motion check.
  const hasNavigated = useHasNavigated();

  useRememberHandoff(rankingPieChartHandoff, transitionName, data);

  return (
    <SharedElement name={transitionName}>
      <div className="relative min-h-[206px] w-full">
        {/* After a navigation the static ring is what shows; Recharts' own sectors stay invisible over it, only there
            for the tooltip */}
        {hasNavigated && <StaticRing data={data} />}
        <ResponsiveContainer height={CHART_HEIGHT} width="100%">
          <PieChart height={400} width={400}>
            <Pie
              className={hasNavigated ? "opacity-0" : ""}
              cx="50%"
              cy="50%"
              data={data}
              dataKey="value"
              innerRadius={INNER_RADIUS}
              isAnimationActive={hasNavigated ? false : "auto"}
              outerRadius={OUTER_RADIUS}
            />
            {!hasNavigated && <CenterLabel data={data} />}
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </SharedElement>
  );
};

export default RankingPieChart;
