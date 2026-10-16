import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { FC, ReactNode } from "react";

import { getMatchupColors, type MatchupColors } from "@/lib/liveScores/teamColors";
import type { GameStakes as GameStakesData, PickStatus } from "@/lib/riding/stakes";

type TeamRef = { TeamPrimaryColor: string; TeamSecondaryColor: string; TeamShortName: string } | null;

type Props = {
  game: {
    GameStatus: string;
    HomeTeamID: number;
    VisitorTeamID: number;
    homeTeam: TeamRef;
    visitorTeam: TeamRef;
  };
  stakes: GameStakesData | undefined;
};

const STATUS_STYLES: Record<PickStatus, string> = {
  losing: "text-red-600 dark:text-red-400",
  tied: "text-muted-foreground",
  winning: "text-green-700 dark:text-green-400",
};

const STATUS_LABELS: Record<PickStatus, string> = { losing: "Losing", tied: "Tied", winning: "Winning" };

// A game the live feed reports as over is settled on the field, so it reads in the past tense
const FINAL_STATUS_LABELS: Record<PickStatus, string> = { losing: "Lost", tied: "Tied", winning: "Won" };

const pluralizePicks = (count: number): string => `${count} ${count === 1 ? "pick" : "picks"}`;

const ordinal = (value: number): string => {
  const suffixes: Record<number, string> = { 1: "st", 2: "nd", 3: "rd" };
  const isTeen = value % 100 >= 11 && value % 100 <= 13;

  return `${value}${isTeen ? "th" : (suffixes[value % 10] ?? "th")}`;
};

const formatRank = (rank: number, isTied: boolean): string => `${isTied ? "tied " : ""}${ordinal(rank)}`;

const signed = (value: number): string => (value > 0 ? `+${value}` : `${value}`);

const Row: FC<{ children: ReactNode; label: string }> = ({ children, label }) => (
  <div className="flex items-baseline justify-between gap-3 py-1">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="text-right font-medium tabular-nums">{children}</dd>
  </div>
);

type SplitBarProps = { colors: MatchupColors; homeCount: number; visitorCount: number };

const SplitBar: FC<SplitBarProps> = ({ colors, homeCount, visitorCount }) => {
  const total = homeCount + visitorCount;

  if (total === 0) {
    return null;
  }

  return (
    <div aria-hidden className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-border">
      <div style={{ backgroundColor: colors.home, width: `${(homeCount / total) * 100}%` }} />
      <div className="grow" style={{ backgroundColor: colors.visitor }} />
    </div>
  );
};

const PoolSplitSection: FC<{ game: Props["game"]; split: GameStakesData["split"] }> = ({ game, split }) => {
  const colors = getMatchupColors(game.homeTeam, game.visitorTeam);

  return (
    <div className="py-1">
      <div className="text-muted-foreground">Pool split</div>
      <div className="flex justify-between gap-3 font-medium tabular-nums">
        <span>
          <span
            aria-hidden
            className="me-1.5 inline-block size-2 rounded-full"
            style={{ backgroundColor: colors.home }}
          />
          {game.homeTeam?.TeamShortName} {pluralizePicks(split.home.count)} · {split.home.points} pts
        </span>
        <span className="text-right">
          {split.visitor.points} pts · {pluralizePicks(split.visitor.count)} {game.visitorTeam?.TeamShortName}
          <span
            aria-hidden
            className="ms-1.5 inline-block size-2 rounded-full"
            style={{ backgroundColor: colors.visitor }}
          />
        </span>
      </div>
      <SplitBar colors={colors} homeCount={split.home.count} visitorCount={split.visitor.count} />
    </div>
  );
};

type PickRowsProps = { pick: NonNullable<GameStakesData["pick"]>; stakes: GameStakesData; teamName: string };

const WhatIfRows: FC<PickRowsProps> = ({ pick, stakes, teamName }) => (
  <>
    <Row label={`If ${teamName} wins`}>
      {signed(pick.ifWins.total - stakes.currentTotal)} pts · {formatRank(pick.ifWins.rank, pick.ifWins.isTied)}
    </Row>
    <Row label={`If ${teamName} loses`}>
      {signed(pick.ifLoses.total - stakes.currentTotal)} pts · {formatRank(pick.ifLoses.rank, pick.ifLoses.isTied)}
    </Row>
  </>
);

const MyPickRows: FC<PickRowsProps & { isFinal: boolean }> = ({ isFinal, ...props }) => (
  <>
    <Row label="Your pick">
      {props.teamName} · {props.pick.points} pts ·{" "}
      <span className={cn("font-bold", STATUS_STYLES[props.pick.status])}>
        {(isFinal ? FINAL_STATUS_LABELS : STATUS_LABELS)[props.pick.status]}
      </span>
    </Row>
    <Row label="Projected this week">
      {props.stakes.currentTotal} pts · {formatRank(props.stakes.currentRank, props.stakes.currentIsTied)}
    </Row>
    {isFinal ? null : <WhatIfRows {...props} />}
  </>
);

const getPickTeamName = (game: Props["game"], teamId: number): string =>
  (teamId === game.HomeTeamID ? game.homeTeam : game.visitorTeam)?.TeamShortName ?? "Pick";

/** Collapsible "what's riding on this game" panel for a started, not-yet-final game. Renders nothing without stakes. */
const GameStakes: FC<Props> = ({ game, stakes }) => {
  if (!stakes) {
    return null;
  }

  return (
    <details className="border border-t-0 border-border bg-muted px-3 text-sm">
      <summary className="cursor-pointer select-none py-2 font-semibold marker:text-muted-foreground">
        What&apos;s riding
        {stakes.pick ? (
          <span className={cn("ms-2 font-normal", STATUS_STYLES[stakes.pick.status])}>
            {getPickTeamName(game, stakes.pick.teamId)} · {stakes.pick.points} pts
          </span>
        ) : null}
      </summary>
      <dl className="pb-2">
        {stakes.pick ? (
          <MyPickRows
            isFinal={game.GameStatus === "Final"}
            pick={stakes.pick}
            stakes={stakes}
            teamName={getPickTeamName(game, stakes.pick.teamId)}
          />
        ) : null}
        <PoolSplitSection game={game} split={stakes.split} />
      </dl>
    </details>
  );
};

export default GameStakes;
