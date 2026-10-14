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

import { type FC, Fragment, useEffect } from "react";

import GameDetailsLink from "@/components/GameDetailsLink/GameDetailsLink";
import GameStakes from "@/components/GameStakes/GameStakes";
import LiveGameStrip from "@/components/LiveGameStrip/LiveGameStrip";
import ScoreboardDate from "@/components/ScoreboardDate/ScoreboardDate";
import ScoreboardGameCard, { type ScoreboardGame } from "@/components/ScoreboardGameCard/ScoreboardGameCard";
import { rememberScoreboardGames, rememberScoreboardScroll } from "@/components/ScoreboardGameCard/scoreboardHandoff";
import { formatDateForKickoff } from "@/lib/dates";
import { useIsClient } from "@/lib/hooks/useIsClient";
import type { GameStakes as GameStakesData } from "@/lib/riding/stakes";

type Props = {
  games: readonly ScoreboardGame[];
  stakes?: Record<number, GameStakesData> | undefined;
};

// Indexes of the games that start a new kickoff day, in the visitor's timezone
const getDayHeaderIndexes = (games: Props["games"]): Set<number> => {
  const indexes = new Set<number>();

  for (const [index, game] of games.entries()) {
    const previousGame = games[index - 1];
    const currentKickoff = formatDateForKickoff(game.GameKickoff);
    const previousKickoff = previousGame ? formatDateForKickoff(previousGame.GameKickoff) : undefined;

    if (currentKickoff !== previousKickoff) {
      indexes.add(index);
    }
  }

  return indexes;
};

const ScoreboardGamesList: FC<Props> = ({ games, stakes }) => {
  // Kept on the client so the game page, and this page on the way back, can show these cards while they load
  useEffect(() => {
    rememberScoreboardGames(games, stakes);
  }, [games, stakes]);

  // The scroll position at the tap that leaves the page (read later, it can already be reset or anchored elsewhere)
  useEffect(() => {
    const handleClick = () => rememberScoreboardScroll(window.scrollY);

    document.addEventListener("click", handleClick, true);

    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  // Day grouping depends on the visitor's timezone, unknown while server rendering and hydrating
  const headerIndexes = useIsClient() ? getDayHeaderIndexes(games) : null;

  return (
    <>
      {games.map((game, index) => (
        <Fragment key={`game-${game.GameID}`}>
          {headerIndexes?.has(index) && <ScoreboardDate isFirst={index === 0} kickoff={game.GameKickoff} />}
          <div className="mb-3">
            <ScoreboardGameCard game={game} priority={index === 0} />
            <LiveGameStrip game={game} />
            <GameDetailsLink game={game} />
            <GameStakes game={game} stakes={stakes?.[game.GameID]} />
          </div>
        </Fragment>
      ))}
    </>
  );
};

export default ScoreboardGamesList;
