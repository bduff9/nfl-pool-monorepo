import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { FC } from "react";

import GameStatusDisplay from "@/components/GameStatusDisplay/GameStatusDisplay";
import ScoreboardTeam from "@/components/ScoreboardTeam/ScoreboardTeam";
import SharedElement from "@/components/ViewTransitions/SharedElement";
import { getGameTransitionName } from "@/lib/gameTransitionNames";
import type { WithLiveFlag } from "@/lib/liveScores/applyLiveScores";
import type { getGamesForWeekScoreboardCached } from "@/server/loaders/game";

export type ScoreboardGame = WithLiveFlag<Awaited<ReturnType<typeof getGamesForWeekScoreboardCached>>[number]>;

const isLiveUnfinished = (game: ScoreboardGame): boolean => game.isLiveOverlay && game.GameStatus !== "Final";

const TIMEOUT_FIELDS = { home: "homeTimeouts", visitor: "awayTimeouts" } as const;

// Timeouts only mean something while the live overlay is showing an unfinished game
const getLiveTimeouts = (game: ScoreboardGame, side: keyof typeof TIMEOUT_FIELDS): number | undefined =>
  isLiveUnfinished(game) ? game.liveSituation?.[TIMEOUT_FIELDS[side]] : undefined;

type Props = {
  game: ScoreboardGame;
  priority?: boolean;
};

/**
 * A game's teams, scores and status, as shown on the scoreboard and at the top of its game page. Games with an ESPN
 * event id (the ones that link to a game page) carry the same view transition name on both pages, so the card moves
 * between them on navigation.
 */
const ScoreboardGameCard: FC<Props> = ({ game, priority = false }) => (
  <SharedElement name={getGameTransitionName(game.espnEventId)}>
    <div className={cn("p-3 flex bg-muted border border-border")}>
      <div className={cn("flex shrink flex-wrap")}>
        <ScoreboardTeam
          gameId={game.GameID}
          gameStatus={game.GameStatus}
          hasPossession={game.GameHasPossession === game.HomeTeamID}
          isInRedzone={game.GameInRedzone === game.HomeTeamID}
          isWinner={game.WinnerTeamID === game.HomeTeamID}
          priority={priority}
          score={game.GameHomeScore}
          team={game.homeTeam}
          timeouts={getLiveTimeouts(game, "home")}
        />
        <ScoreboardTeam
          gameId={game.GameID}
          gameStatus={game.GameStatus}
          hasPossession={game.GameHasPossession === game.VisitorTeamID}
          isInRedzone={game.GameInRedzone === game.VisitorTeamID}
          isWinner={game.WinnerTeamID === game.VisitorTeamID}
          priority={priority}
          score={game.GameVisitorScore}
          team={game.visitorTeam}
          timeouts={getLiveTimeouts(game, "visitor")}
        />
      </div>
      <div className={cn("text-right pr-4 text-nowrap pt-4 text-lg grow")}>
        <GameStatusDisplay
          gameStatus={game.GameStatus}
          isLive={game.isLiveOverlay}
          kickoff={game.GameKickoff}
          timeLeft={game.GameTimeLeftInQuarter}
        />
      </div>
    </div>
  </SharedElement>
);

export default ScoreboardGameCard;
