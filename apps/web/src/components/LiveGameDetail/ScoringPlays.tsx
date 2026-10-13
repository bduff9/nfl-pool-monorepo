import type { FC } from "react";

import type { SummaryScoringPlay } from "@/lib/liveGame/espnSummary";

import { formatPlayTime } from "./playFormat";

type Props = {
  homeName: string;
  plays: SummaryScoringPlay[];
  visitorName: string;
};

const hasScore = (play: SummaryScoringPlay): boolean => play.homeScore !== undefined && play.awayScore !== undefined;

const ScoringPlays: FC<Props> = ({ homeName, plays, visitorName }) =>
  plays.length === 0 ? null : (
    <section aria-labelledby="scoring-plays-heading" className="mb-5">
      <h2 className="mb-1 font-semibold" id="scoring-plays-heading">
        Scoring plays
      </h2>
      <ul className="border border-border bg-muted px-3">
        {plays.map((play) => (
          <li className="border-t border-border py-1.5 first:border-t-0" key={play.id}>
            <div className="flex justify-between gap-3 text-xs text-muted-foreground tabular-nums">
              <span>{[formatPlayTime(play.period, play.clock), play.team, play.type].filter(Boolean).join(" · ")}</span>
              {hasScore(play) ? (
                <span>
                  {homeName} {play.homeScore} – {visitorName} {play.awayScore}
                </span>
              ) : null}
            </div>
            <p>{play.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );

export default ScoringPlays;
