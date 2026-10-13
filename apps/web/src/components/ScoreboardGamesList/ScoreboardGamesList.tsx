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

import { cn } from "@nfl-pool-monorepo/utils/styles";
import { type FC, Fragment, useEffect, useState } from "react";

import GameDetailsLink from "@/components/GameDetailsLink/GameDetailsLink";
import GameStakes from "@/components/GameStakes/GameStakes";
import GameStatusDisplay from "@/components/GameStatusDisplay/GameStatusDisplay";
import LiveGameStrip from "@/components/LiveGameStrip/LiveGameStrip";
import ScoreboardDate from "@/components/ScoreboardDate/ScoreboardDate";
import ScoreboardTeam from "@/components/ScoreboardTeam/ScoreboardTeam";
import { formatDateForKickoff } from "@/lib/dates";
import type { WithLiveFlag } from "@/lib/liveScores/applyLiveScores";
import type { GameStakes as GameStakesData } from "@/lib/riding/stakes";
import type { getGamesForWeekScoreboardCached } from "@/server/loaders/game";

type Game = WithLiveFlag<Awaited<ReturnType<typeof getGamesForWeekScoreboardCached>>[number]>;

type Props = {
  games: Game[];
  stakes?: Record<number, GameStakesData>;
};

const isLiveUnfinished = (game: Game): boolean => game.isLiveOverlay && game.GameStatus !== "Final";

const TIMEOUT_FIELDS = { home: "homeTimeouts", visitor: "awayTimeouts" } as const;

// Timeouts only mean something while the live overlay is showing an unfinished game
const getLiveTimeouts = (game: Game, side: keyof typeof TIMEOUT_FIELDS): number | undefined =>
  isLiveUnfinished(game) ? game.liveSituation?.[TIMEOUT_FIELDS[side]] : undefined;

const ScoreboardGamesList: FC<Props> = ({ games, stakes = {} }) => {
  const [headerIndexes, setHeaderIndexes] = useState<Set<number> | null>(null);

  useEffect(() => {
    const indexes = new Set<number>();

    for (const [index, game] of games.entries()) {
      const previousGame = games[index - 1];
      const currentKickoff = formatDateForKickoff(game.GameKickoff);
      const previousKickoff = previousGame ? formatDateForKickoff(previousGame.GameKickoff) : undefined;

      if (currentKickoff !== previousKickoff) {
        indexes.add(index);
      }
    }

    // react-doctor-disable-next-line react-hooks-js/set-state-in-effect, react-doctor/no-adjust-state-on-prop-change -- day grouping depends on the visitor's timezone, unknown during SSR, so it can only be computed after mount; same pattern as ScoreboardDate
    setHeaderIndexes(indexes);
  }, [games]);

  return (
    <>
      {games.map((game, index) => (
        <Fragment key={`game-${game.GameID}`}>
          {headerIndexes?.has(index) && <ScoreboardDate isFirst={index === 0} kickoff={game.GameKickoff} />}
          <div className="mb-3">
            <div className={cn("p-3 flex bg-muted border border-border")}>
              <div className={cn("flex shrink flex-wrap")}>
                <ScoreboardTeam
                  gameStatus={game.GameStatus}
                  hasPossession={game.GameHasPossession === game.HomeTeamID}
                  isInRedzone={game.GameInRedzone === game.HomeTeamID}
                  isWinner={game.WinnerTeamID === game.HomeTeamID}
                  priority={index === 0}
                  score={game.GameHomeScore}
                  team={game.homeTeam}
                  timeouts={getLiveTimeouts(game, "home")}
                />
                <ScoreboardTeam
                  gameStatus={game.GameStatus}
                  hasPossession={game.GameHasPossession === game.VisitorTeamID}
                  isInRedzone={game.GameInRedzone === game.VisitorTeamID}
                  isWinner={game.WinnerTeamID === game.VisitorTeamID}
                  priority={index === 0}
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
            <LiveGameStrip game={game} />
            <GameDetailsLink game={game} />
            <GameStakes game={game} stakes={stakes[game.GameID]} />
          </div>
        </Fragment>
      ))}
    </>
  );
};

export default ScoreboardGamesList;
