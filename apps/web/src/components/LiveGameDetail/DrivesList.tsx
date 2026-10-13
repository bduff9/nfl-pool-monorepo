import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { FC } from "react";

import type { SummaryDrive, SummaryPlay } from "@/lib/liveGame/espnSummary";

import { formatPlayTime } from "./playFormat";

const getLabelClasses = (play: SummaryPlay): string => {
  if (play.isScoring) {
    return "text-green-700 dark:text-green-400";
  }

  return play.isTurnover ? "text-red-600 dark:text-red-400" : "text-muted-foreground";
};

const PlayItem: FC<{ play: SummaryPlay }> = ({ play }) => (
  <li className="border-t border-border py-1.5 first:border-t-0">
    <div className="text-xs text-muted-foreground tabular-nums">
      {[formatPlayTime(play.period, play.clock), play.downDistance].filter(Boolean).join(" · ")}
    </div>
    <p>
      {play.label ? (
        <strong className={cn("me-1.5 text-xs font-bold tracking-wide", getLabelClasses(play))}>{play.label}</strong>
      ) : null}
      {play.text}
    </p>
  </li>
);

const PlayList: FC<{ plays: SummaryPlay[] }> = ({ plays }) =>
  plays.length === 0 ? (
    <p className="py-1.5 text-muted-foreground">No plays yet.</p>
  ) : (
    <ul>
      {plays.map((play) => (
        <PlayItem key={play.id} play={play} />
      ))}
    </ul>
  );

export const CurrentDrive: FC<{ drive: SummaryDrive }> = ({ drive }) => (
  <section aria-labelledby="current-drive-heading" className="mb-5">
    <h2 className="font-semibold" id="current-drive-heading">
      Current drive
    </h2>
    <p className="mb-1 text-muted-foreground">{drive.headline}</p>
    <div className="border border-border bg-muted px-3">
      <PlayList plays={drive.plays} />
    </div>
  </section>
);

export const PreviousDrives: FC<{ drives: SummaryDrive[] }> = ({ drives }) =>
  drives.length === 0 ? null : (
    <section aria-labelledby="previous-drives-heading" className="mb-5">
      <h2 className="mb-1 font-semibold" id="previous-drives-heading">
        Previous drives
      </h2>
      {drives.map((drive) => (
        <details className="border border-t-0 border-border bg-muted px-3 first:border-t" key={drive.id}>
          <summary className="cursor-pointer py-2 select-none marker:text-muted-foreground">{drive.headline}</summary>
          <PlayList plays={drive.plays} />
        </details>
      ))}
    </section>
  );
