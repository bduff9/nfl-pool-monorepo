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
import Image from "next/image";
import type { FC } from "react";
import { PiFootballDuotone } from "react-icons/pi";

import type { getGamesForWeekCached } from "@/server/loaders/game";

type ScoreboardTeamProps = {
  gameStatus: Awaited<ReturnType<typeof getGamesForWeekCached>>[number]["GameStatus"];
  hasPossession: boolean;
  isInRedzone: boolean;
  isWinner: boolean;
  score: number;
  team:
    | Awaited<ReturnType<typeof getGamesForWeekCached>>[number]["homeTeam"]
    | Awaited<ReturnType<typeof getGamesForWeekCached>>[number]["visitorTeam"];
};

const ScoreboardTeam: FC<ScoreboardTeamProps> = ({ gameStatus, hasPossession, isInRedzone, isWinner, score, team }) => {
  const isLoser = !isWinner && gameStatus === "Final";

  if (!team) return null;

  return (
    <>
      <div>
        <Image
          alt={`${team.TeamCity} ${team.TeamName}`}
          className={cn("h-auto m-w-full", isLoser && "grayscale")}
          height={70}
          src={`/NFLLogos/${team.TeamLogo}`}
          title={`${team.TeamCity} ${team.TeamName}`}
          width={70}
        />
      </div>
      <div
        className={cn(
          "flex-grow flex items-center ps-3",
          isWinner && "text-green-600",
          isWinner && "font-bold",
          isLoser && "text-muted",
          isInRedzone && "text-red-600",
        )}
      >
        <span className="hidden md:inline">
          {team.TeamCity} {team.TeamName}
        </span>
        <span className="md:hidden">{team.TeamShortName}</span>
      </div>
      <div
        className={cn(
          "flex items-center pe-3",
          isWinner && "text-green-600",
          isWinner && "font-bold",
          isLoser && "text-muted",
          isInRedzone && "text-red-600",
        )}
      >
        {gameStatus !== "Pregame" && (
          <>
            {hasPossession && <PiFootballDuotone className={cn("me-2", !isInRedzone && "text-amber-800")} />}
            {score}
          </>
        )}
      </div>
      <div className="w-full"></div>
    </>
  );
};

export default ScoreboardTeam;
