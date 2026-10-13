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
import type { FC } from "react";
import { PiFootballDuotone } from "react-icons/pi";

import type { getGamesForWeekCached } from "@/server/loaders/game";

import TeamLogo from "../TeamLogo/TeamLogo";
import TimeoutDots from "../TimeoutDots/TimeoutDots";
import { getLogoClasses, getPossessionClasses, getScoreboardTextClasses, isLoserOf } from "./scoreboardTeamHelpers";

type ScoreboardTeamProps = {
  gameStatus: Awaited<ReturnType<typeof getGamesForWeekCached>>[number]["GameStatus"];
  hasPossession: boolean;
  isInRedzone: boolean;
  isWinner: boolean;
  priority?: boolean;
  score: number;
  /** Timeouts left, from the live overlay; only passed for games in progress. */
  timeouts?: number | undefined;
  team:
    | Awaited<ReturnType<typeof getGamesForWeekCached>>[number]["homeTeam"]
    | Awaited<ReturnType<typeof getGamesForWeekCached>>[number]["visitorTeam"];
};

type TeamNameCellProps = {
  classes: string;
  team: NonNullable<ScoreboardTeamProps["team"]>;
  timeouts?: number | undefined;
};

const TeamNameCell: FC<TeamNameCellProps> = ({ classes, team, timeouts }) => (
  <div className={cn("flex-grow flex flex-col justify-center ps-3", classes)}>
    <span className="hidden md:inline">
      {team.TeamCity} {team.TeamName}
    </span>
    <span className="md:hidden">{team.TeamShortName}</span>
    {timeouts === undefined ? null : <TimeoutDots className="mt-1" name={team.TeamShortName} remaining={timeouts} />}
  </div>
);

type ScoreCellProps = Pick<ScoreboardTeamProps, "gameStatus" | "hasPossession" | "isInRedzone" | "score"> & {
  classes: string;
};

const ScoreCell: FC<ScoreCellProps> = ({ classes, gameStatus, hasPossession, isInRedzone, score }) => (
  <div className={cn("flex items-center pe-3", classes)}>
    {gameStatus !== "Pregame" && (
      <>
        {!!hasPossession && <PiFootballDuotone className={getPossessionClasses(isInRedzone)} />}
        {score}
      </>
    )}
  </div>
);

const ScoreboardTeam: FC<ScoreboardTeamProps> = ({
  gameStatus,
  hasPossession,
  isInRedzone,
  isWinner,
  priority = false,
  score,
  team,
  timeouts,
}) => {
  const isLoser = isLoserOf(isWinner, gameStatus);
  const textClasses = getScoreboardTextClasses(isWinner, isLoser, isInRedzone);

  if (!team) return null;

  return (
    <>
      <div>
        <TeamLogo className={getLogoClasses(isLoser)} priority={priority} team={team} />
      </div>
      <TeamNameCell classes={textClasses} team={team} timeouts={timeouts} />
      <ScoreCell
        classes={textClasses}
        gameStatus={gameStatus}
        hasPossession={hasPossession}
        isInRedzone={isInRedzone}
        score={score}
      />
      <div className="w-full"></div>
    </>
  );
};

export default ScoreboardTeam;
