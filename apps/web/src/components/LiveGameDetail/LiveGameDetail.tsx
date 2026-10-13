import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { FC } from "react";

import GameStatusDisplay from "@/components/GameStatusDisplay/GameStatusDisplay";
import TeamLogo from "@/components/TeamLogo/TeamLogo";
import { WeekLink } from "@/components/WeekLink/WeekLink";
import type { LiveGameSummary, SummaryHeader, SummaryTeam } from "@/lib/liveGame/espnSummary";
import { getMatchupColors, type MatchupColors } from "@/lib/liveScores/teamColors";
import type { GameTeam, GameTeams } from "@/server/loaders/gameTeams";

import { CurrentDrive, PreviousDrives } from "./DrivesList";
import ScoringPlays from "./ScoringPlays";
import WinProbabilityChart from "./WinProbabilityChart";

type Props = {
  summary: LiveGameSummary | null;
  teams: GameTeams;
};

const TeamScore: FC<{ dbTeam: GameTeam | null; team: SummaryTeam }> = ({ dbTeam, team }) => (
  <div className="flex items-center gap-3 text-2xl font-bold tabular-nums">
    {dbTeam ? <TeamLogo size={44} team={dbTeam} /> : null}
    <span className="grow">{dbTeam ? `${dbTeam.TeamCity} ${dbTeam.TeamName}` : team.name}</span>
    <span>{team.score}</span>
  </div>
);

const ClockStatus: FC<{ header: SummaryHeader }> = ({ header }) => (
  <span className={cn("font-semibold", header.state === "in" && "text-red-600 dark:text-red-400")}>
    {header.state === "in" ? "LIVE · " : null}
    {header.statusText}
  </span>
);

const StatusText: FC<{ header: SummaryHeader }> = ({ header }) => {
  if (header.state === "pre") {
    return header.kickoff ? (
      <GameStatusDisplay gameStatus="Pregame" kickoff={new Date(header.kickoff)} timeLeft="" />
    ) : null;
  }

  return <ClockStatus header={header} />;
};

const GameHeader: FC<{ header: SummaryHeader; teams: GameTeams }> = ({ header, teams }) => (
  <div className="mb-5 flex flex-col gap-2 border border-border bg-muted p-3">
    <TeamScore dbTeam={teams.home} team={header.home} />
    <TeamScore dbTeam={teams.away} team={header.away} />
    <div className="mt-2 text-sm text-muted-foreground">
      <StatusText header={header} />
    </div>
  </div>
);

const Unavailable: FC = () => (
  <p className="border border-border bg-muted p-3 text-muted-foreground">Live details are unavailable right now.</p>
);

const Pregame: FC = () => (
  <p className="border border-border bg-muted p-3 text-muted-foreground">Live details appear once the game starts.</p>
);

type GameBodyProps = { colors: MatchupColors; header: SummaryHeader; summary: LiveGameSummary };

const GameBody: FC<GameBodyProps> = ({ colors, header, summary }) => (
  <>
    {summary.currentDrive ? <CurrentDrive drive={summary.currentDrive} /> : null}
    <WinProbabilityChart
      colors={colors}
      homeName={header.home.name}
      values={summary.winProbability}
      visitorName={header.away.name}
    />
    <ScoringPlays homeName={header.home.name} plays={summary.scoringPlays} visitorName={header.away.name} />
    <PreviousDrives drives={summary.previousDrives} />
  </>
);

type GameContentProps = { header: SummaryHeader; summary: LiveGameSummary; teams: GameTeams };

const GameContent: FC<GameContentProps> = ({ header, summary, teams }) => (
  <>
    <GameHeader header={header} teams={teams} />
    {header.state === "pre" ? (
      <Pregame />
    ) : (
      <GameBody colors={getMatchupColors(teams.home, teams.away)} header={header} summary={summary} />
    )}
  </>
);

const LiveGameDetail: FC<Props> = ({ summary, teams }) => (
  <div className="px-3">
    <WeekLink className="inline-block py-2.5" href="/scoreboard">
      &laquo; Back to Scoreboard
    </WeekLink>
    {summary?.header ? <GameContent header={summary.header} summary={summary} teams={teams} /> : <Unavailable />}
  </div>
);

export default LiveGameDetail;
