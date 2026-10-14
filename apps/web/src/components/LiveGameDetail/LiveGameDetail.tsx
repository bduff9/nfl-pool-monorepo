import { type FC, ViewTransition } from "react";

import type { LiveGameSummary, SummaryHeader } from "@/lib/liveGame/espnSummary";
import { getMatchupColors, type MatchupColors } from "@/lib/liveScores/teamColors";
import type { GameTeams } from "@/server/loaders/gameTeams";

import { CurrentDrive, PreviousDrives } from "./DrivesList";
import ScoringPlays from "./ScoringPlays";
import WinProbabilityChart from "./WinProbabilityChart";

type Props = {
  summary: LiveGameSummary | null;
  teams: GameTeams;
};

// LiveGameDetail renders into the game page's grid: on wider screens the win probability chart sits beside the game
// card, in the second column of the first row, and everything else spans both columns below them
const Unavailable: FC = () => (
  <p className="border border-border bg-muted p-3 text-muted-foreground md:col-span-2">
    Live details are unavailable right now.
  </p>
);

const Pregame: FC = () => (
  <p className="border border-border bg-muted p-3 text-muted-foreground md:col-span-2">
    Live details appear once the game starts.
  </p>
);

type GameBodyProps = { colors: MatchupColors; header: SummaryHeader; summary: LiveGameSummary };

const GameBody: FC<GameBodyProps> = ({ colors, header, summary }) => (
  <>
    {summary.currentDrive ? (
      <div className="md:col-span-2">
        <CurrentDrive drive={summary.currentDrive} />
      </div>
    ) : null}
    <div className="md:col-start-2 md:row-start-1">
      <WinProbabilityChart
        colors={colors}
        homeName={header.home.name}
        values={summary.winProbability}
        visitorName={header.away.name}
      />
    </div>
    <div className="md:col-span-2">
      <ScoringPlays homeName={header.home.name} plays={summary.scoringPlays} visitorName={header.away.name} />
      <PreviousDrives drives={summary.previousDrives} />
    </div>
  </>
);

// The game page shows the game's scoreboard card above this, so this is only the live detail below it
const LiveGameDetail: FC<Props> = ({ summary, teams }) => {
  if (!summary?.header) {
    return <Unavailable />;
  }

  // The lists' rows slide in when a live refresh adds them (LiveRow). This boundary is what enters when the details
  // appear (on the page's first load, or on a refresh once the game kicks off or ESPN is reachable again), and it does
  // not animate, so the rows already in the lists do not all slide in at once: React only animates the outermost
  // boundary that enters.
  return summary.header.state === "pre" ? (
    <Pregame />
  ) : (
    <ViewTransition default="none">
      <GameBody colors={getMatchupColors(teams.home, teams.away)} header={summary.header} summary={summary} />
    </ViewTransition>
  );
};

export default LiveGameDetail;
