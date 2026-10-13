import type { FC } from "react";

import { buildSparkline } from "@/lib/liveGame/sparkline";
import { getWinLeader } from "@/lib/liveGame/winLeader";
import type { MatchupColors } from "@/lib/liveScores/teamColors";

const WIDTH = 300;
const HEIGHT = 80;
// Room around the plot so the line and end dot are not clipped at the edges
const PAD = 5;

// Position within the padded viewBox, as a percentage of the rendered box
const toPercent = (value: number, size: number): number => ((value + PAD) / (size + PAD * 2)) * 100;

type Props = {
  colors: MatchupColors;
  homeName: string;
  values: number[];
  visitorName: string;
};

/**
 * Home win probability after each play. The top half is tinted with the home team's color and the bottom half with
 * the visitor's, and every stretch of the line is drawn in the color of the team projected to win at that point.
 */
const WinProbabilityChart: FC<Props> = ({ colors, homeName, values, visitorName }) => {
  const sparkline = buildSparkline(values, WIDTH, HEIGHT);
  const latest = values.at(-1);

  if (!sparkline || latest === undefined) {
    return null;
  }

  const homePct = Math.round(latest);
  const leader = getWinLeader(homePct, homeName, visitorName);
  const leaderColor = leader.name === homeName ? colors.home : colors.visitor;

  return (
    <section aria-labelledby="win-probability-heading" className="mb-5">
      <h2 className="mb-1 font-semibold" id="win-probability-heading">
        Win probability
      </h2>
      <div className="flex items-stretch gap-2">
        <div aria-hidden className="flex flex-col justify-between py-0.5 text-xs font-semibold">
          <span style={{ color: colors.home }}>{homeName}</span>
          <span style={{ color: colors.visitor }}>{visitorName}</span>
        </div>
        {/* Fixed height, stretched to the width: wide screens get a longer timeline, not a taller chart */}
        <div className="relative h-24 min-w-0 flex-1 md:h-32">
          <svg
            aria-label={`${homeName} win probability over the game, now ${homePct}%`}
            className="size-full rounded-sm bg-muted"
            preserveAspectRatio="none"
            role="img"
            viewBox={`${-PAD} ${-PAD} ${WIDTH + PAD * 2} ${HEIGHT + PAD * 2}`}
          >
            <rect fill={colors.home} fillOpacity={0.12} height={sparkline.midY} width={WIDTH} x={0} y={0} />
            <rect
              fill={colors.visitor}
              fillOpacity={0.12}
              height={HEIGHT - sparkline.midY}
              width={WIDTH}
              x={0}
              y={sparkline.midY}
            />
            <line
              className="stroke-border"
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
              x1={0}
              x2={WIDTH}
              y1={sparkline.midY}
              y2={sparkline.midY}
            />
            {/* The same line twice, each clipped to one half, so it takes the projected winner's color point by point */}
            <defs>
              <clipPath id="win-probability-home-half">
                <rect height={sparkline.midY + PAD} width={WIDTH + PAD * 2} x={-PAD} y={-PAD} />
              </clipPath>
              <clipPath id="win-probability-visitor-half">
                <rect height={HEIGHT - sparkline.midY + PAD} width={WIDTH + PAD * 2} x={-PAD} y={sparkline.midY} />
              </clipPath>
            </defs>
            <polyline
              clipPath="url(#win-probability-home-half)"
              fill="none"
              points={sparkline.points}
              stroke={colors.home}
              strokeLinejoin="round"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
            <polyline
              clipPath="url(#win-probability-visitor-half)"
              fill="none"
              points={sparkline.points}
              stroke={colors.visitor}
              strokeLinejoin="round"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {/* An HTML dot, since an SVG circle would stretch into an oval with the chart */}
          <span
            aria-hidden
            className="absolute size-2 -translate-1/2 rounded-full"
            style={{
              backgroundColor: leaderColor,
              left: `${toPercent(sparkline.endX, WIDTH)}%`,
              top: `${toPercent(sparkline.endY, HEIGHT)}%`,
            }}
          />
        </div>
      </div>
      <p className="mt-1 flex items-center justify-end gap-1 text-xs text-muted-foreground tabular-nums">
        <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: leaderColor }} />
        Now: {leader.name} {leader.pct}%
      </p>
    </section>
  );
};

export default WinProbabilityChart;
