import type { HistoryEntry } from "@nfl-pool-monorepo/db/src/queries/history";
import type { FC } from "react";

type Props = {
  allYears: number[];
  entries: HistoryEntry[];
};

const WIDTH = 1200;
const HEIGHT = 300;
const PADDING = { bottom: 36, left: 110, right: 24, top: 16 };
// Fixed scale of possible outcomes: 1st through 3rd, then "did not place".
const DID_NOT_PLACE = 4;
const Y_LABELS = ["1st", "2nd", "3rd", "Didn't place"];

// fallow-ignore-next-line complexity -- SVG chart composition; branching is the fixed 4-row scale mapping
const HistoryTrendChart: FC<Props> = ({ allYears, entries }) => {
  const overallByYear = new Map<number, number>();
  const survivorByYear = new Map<number, number>();

  for (const entry of entries) {
    if (entry.HistoryType === "Overall") {
      overallByYear.set(entry.HistoryYear, entry.HistoryPlace);
    }

    if (entry.HistoryType === "Survivor") {
      survivorByYear.set(entry.HistoryYear, entry.HistoryPlace);
    }
  }

  // Every year the pool has history for, so years without a placement still get an x-axis value
  const years = [...allYears].sort((a, b) => a - b);

  if (years.length < 2) {
    return null;
  }

  const placeFor = (placesByYear: Map<number, number>, year: number): number => placesByYear.get(year) ?? DID_NOT_PLACE;

  const x = (year: number): number => {
    const step = years.length > 1 ? (WIDTH - PADDING.left - PADDING.right) / (years.length - 1) : 0;

    return PADDING.left + step * years.indexOf(year);
  };

  const y = (place: number): number =>
    PADDING.top + ((place - 1) / (DID_NOT_PLACE - 1)) * (HEIGHT - PADDING.top - PADDING.bottom);

  const toPoints = (placesByYear: Map<number, number>): string =>
    years.map((year) => `${x(year)},${y(placeFor(placesByYear, year))}`).join(" ");

  const yearLabelY = HEIGHT - 8;

  return (
    <div className="border border-border rounded-lg p-4 mb-8">
      <h3 className="text-xl font-semibold mb-2">Your placements over time</h3>
      <div className="flex gap-4 mb-2 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-full" style={{ backgroundColor: "#15803d" }} />
          Overall
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-full" style={{ backgroundColor: "#7e22ce" }} />
          Survivor
        </span>
      </div>
      <svg className="w-full" role="img" viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <title>Line chart of your overall and survivor pool placements by year</title>
        {Y_LABELS.map((label, i) => {
          const place = i + 1;

          return (
            <g key={`gridline-${label}`}>
              <line
                stroke="currentColor"
                strokeOpacity={0.15}
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={y(place)}
                y2={y(place)}
              />
              <text className="fill-current text-xs opacity-70" textAnchor="end" x={PADDING.left - 6} y={y(place) + 4}>
                {label}
              </text>
            </g>
          );
        })}
        <polyline fill="none" points={toPoints(overallByYear)} stroke="#15803d" strokeWidth={2.5} />
        <polyline fill="none" points={toPoints(survivorByYear)} stroke="#7e22ce" strokeWidth={2.5} />
        {years.map((year) => (
          <text className="fill-current text-xs" key={`year-${year}`} textAnchor="middle" x={x(year)} y={yearLabelY}>
            {year}
          </text>
        ))}
        {years.flatMap((year) =>
          [
            { color: "#15803d", place: placeFor(overallByYear, year) },
            { color: "#7e22ce", place: placeFor(survivorByYear, year) },
          ].map(({ color, place }) => (
            <circle cx={x(year)} cy={y(place)} fill={color} key={`${year}-${color}`} r={4} />
          )),
        )}
      </svg>
    </div>
  );
};

export default HistoryTrendChart;
