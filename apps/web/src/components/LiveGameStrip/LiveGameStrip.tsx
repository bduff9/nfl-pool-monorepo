import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { Route } from "next";
import type { FC } from "react";

import { getWinLeader } from "@/lib/liveGame/winLeader";
import type { LastPlay, LiveSituation } from "@/lib/liveScores/espnSituation";
import { getMatchupColors, type MatchupColors } from "@/lib/liveScores/teamColors";

import { WeekLink } from "../WeekLink/WeekLink";

type TeamRef = { TeamPrimaryColor: string; TeamSecondaryColor: string; TeamShortName: string } | null;

type StripGame = {
  GameInRedzone: number | null;
  GameStatus: string;
  GameWeek: number;
  espnEventId?: string | undefined;
  homeTeam: TeamRef;
  isLiveOverlay: boolean;
  liveSituation?: LiveSituation | undefined;
  visitorTeam: TeamRef;
};

type Props = {
  game: StripGame;
};

const DownAndSpot: FC<{ ballSpot?: string | undefined; downDistance?: string | undefined; inRedZone: boolean }> = ({
  ballSpot,
  downDistance,
  inRedZone,
}) => {
  const text = [downDistance, ballSpot].filter(Boolean).join(" · ");

  if (!text) {
    return null;
  }

  return (
    <p className={cn("font-semibold", inRedZone && "text-red-600 dark:text-red-400")}>
      {text}
      {inRedZone ? <span className="ms-1.5 text-[10px] font-bold tracking-wide uppercase">Red zone</span> : null}
    </p>
  );
};

const getLabelClasses = (play: LastPlay): string => {
  if (play.isScoring) {
    return "text-green-700 dark:text-green-400";
  }

  return play.isTurnover ? "text-red-600 dark:text-red-400" : "text-muted-foreground";
};

// Keyed on the play so the highlight animation restarts whenever a new play arrives
const LastPlayLine: FC<{ play: LastPlay }> = ({ play }) => (
  <p
    className="live-play-flash -mx-1 mt-1 line-clamp-2 rounded-sm px-1 text-muted-foreground"
    key={play.id ?? play.text}
  >
    {play.label ? (
      <strong className={cn("me-1.5 text-xs font-bold tracking-wide", getLabelClasses(play))}>{play.label}</strong>
    ) : null}
    <span className="text-foreground">{play.text}</span>
  </p>
);

type WinProbabilityProps = { colors: MatchupColors; homeName: string; homeWinPct: number; visitorName: string };

const WinProbability: FC<WinProbabilityProps> = ({ colors, homeName, homeWinPct, visitorName }) => {
  const leader = getWinLeader(homeWinPct, homeName, visitorName);
  const leaderColor = leader.name === homeName ? colors.home : colors.visitor;

  return (
    <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
      {/* Tug of war in team colors: the home team (listed first on the card) fills from the left */}
      <span aria-hidden>{homeName}</span>
      <div aria-hidden className="flex h-1.5 flex-1 gap-px overflow-hidden rounded-full">
        <div className="h-full" style={{ backgroundColor: colors.home, width: `${homeWinPct}%` }} />
        <div className="h-full flex-1" style={{ backgroundColor: colors.visitor }} />
      </div>
      <span aria-hidden>{visitorName}</span>
      <span className="ms-1 flex items-center gap-1 font-semibold text-foreground">
        <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: leaderColor }} />
        {leader.name} {leader.pct}%<span className="sr-only"> chance to win</span>
      </span>
    </div>
  );
};

type StripBodyProps = {
  colors: MatchupColors;
  homeName: string;
  inRedZone: boolean;
  situation: LiveSituation;
  visitorName: string;
};

const StripBody: FC<StripBodyProps> = ({ colors, homeName, inRedZone, situation, visitorName }) => (
  <>
    <DownAndSpot ballSpot={situation.ballSpot} downDistance={situation.downDistance} inRedZone={inRedZone} />
    {situation.lastPlay ? <LastPlayLine play={situation.lastPlay} /> : null}
    {situation.homeWinPct === undefined ? null : (
      <WinProbability colors={colors} homeName={homeName} homeWinPct={situation.homeWinPct} visitorName={visitorName} />
    )}
  </>
);

const isInProgressOverlay = (game: StripGame): boolean => game.isLiveOverlay && game.GameStatus !== "Final";

// Only an overlaid game still in progress, with an ESPN event to link to, gets a strip
const getStripTarget = (game: StripGame): { eventId: string; situation: LiveSituation } | null => {
  if (!isInProgressOverlay(game)) {
    return null;
  }

  return game.espnEventId && game.liveSituation ? { eventId: game.espnEventId, situation: game.liveSituation } : null;
};

const getTeamName = (team: TeamRef, fallback: string): string => team?.TeamShortName ?? fallback;

/**
 * Live detail under an overlaid, in-progress scoreboard card: down & distance, the last play and win
 * probability. The whole strip links to the game's play-by-play page. Renders nothing for any other game.
 */
const LiveGameStrip: FC<Props> = ({ game }) => {
  const target = getStripTarget(game);

  if (!target) {
    return null;
  }

  return (
    <WeekLink
      className="block border border-t-0 border-border bg-muted px-3 py-2 text-sm hover:bg-border/30"
      href={`/scoreboard/game/${target.eventId}?week=${game.GameWeek}` as Route}
      prefetch={false}
      preserveWeek={false}
    >
      <StripBody
        colors={getMatchupColors(game.homeTeam, game.visitorTeam)}
        homeName={getTeamName(game.homeTeam, "Home")}
        inRedZone={game.GameInRedzone !== null}
        situation={target.situation}
        visitorName={getTeamName(game.visitorTeam, "Away")}
      />
    </WeekLink>
  );
};

export default LiveGameStrip;
