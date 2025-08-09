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

import type { FC } from "react";

import { formatTimeFromKickoff } from "@/lib/dates";
import { getShortQuarter } from "@/lib/strings";
import type { getGamesForWeekCached } from "@/server/loaders/game";

type GameStatusDisplayProps = {
  kickoff: Date;
  gameStatus: Awaited<ReturnType<typeof getGamesForWeekCached>>[number]["GameStatus"];
  timeLeft: string;
};

const GameStatusDisplay: FC<GameStatusDisplayProps> = ({ kickoff, gameStatus, timeLeft }) => {
  if (gameStatus === "Final") {
    return <>{gameStatus}</>;
  }

  if (gameStatus === "Pregame") {
    return <>{formatTimeFromKickoff(kickoff)}</>;
  }

  return (
    <>
      <span className="hidden md:inline">{gameStatus}</span>
      <span className="md:hidden">{getShortQuarter(gameStatus)}</span>
      {gameStatus !== "Half Time" && (
        <>
          <br />
          {timeLeft}
        </>
      )}
    </>
  );
};

export default GameStatusDisplay;
