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
import { type FC, ViewTransition } from "react";
import { PiFootballDuotone } from "react-icons/pi";

import { getPossessionTransitionName, getScoreTransitionName } from "@/lib/gameTransitionNames";
import { REFRESH_TRANSITION } from "@/lib/refreshTransition";
import type { getGamesForWeekCached } from "@/server/loaders/game";

import TeamLogo from "../TeamLogo/TeamLogo";
import TimeoutDots from "../TimeoutDots/TimeoutDots";
import SharedElement from "../ViewTransitions/SharedElement";
import { getLogoClasses, getPossessionClasses, getScoreboardTextClasses, isLoserOf } from "./scoreboardTeamHelpers";

type ScoreboardTeamProps = {
  gameId: number;
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

// Keyed on the score, so a live refresh that changes it rolls the old number up and out as the new one rolls up into
// place (score-roll in globals.css). The two share a name, so when the number also shifts sideways (a wider clock
// beside it, the football arriving) the roll travels with it. Only a refresh animates it: on a page change or a reveal
// the number is part of the card.
const RollingScore: FC<{ name: string; score: number }> = ({ name, score }) => (
  <ViewTransition
    default="none"
    key={score}
    name={name}
    share={{ default: "none", [REFRESH_TRANSITION]: "score-roll" }}
  >
    <span className="inline-block">{score}</span>
  </ViewTransition>
);

type ScoreCellProps = Pick<ScoreboardTeamProps, "gameId" | "gameStatus" | "hasPossession" | "isInRedzone" | "score"> & {
  classes: string;
  teamId: number;
};

// The football has the same name in both team rows, so it moves to the other row when possession changes
const ScoreCell: FC<ScoreCellProps> = ({ classes, gameId, gameStatus, hasPossession, isInRedzone, score, teamId }) => (
  <div className={cn("flex items-center pe-3", classes)}>
    {gameStatus !== "Pregame" && (
      <>
        {!!hasPossession && (
          <SharedElement name={getPossessionTransitionName(gameId)}>
            <PiFootballDuotone className={getPossessionClasses(isInRedzone)} />
          </SharedElement>
        )}
        <RollingScore name={getScoreTransitionName(gameId, teamId)} score={score} />
      </>
    )}
  </div>
);

const ScoreboardTeam: FC<ScoreboardTeamProps> = ({
  gameId,
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
        gameId={gameId}
        gameStatus={gameStatus}
        hasPossession={hasPossession}
        isInRedzone={isInRedzone}
        score={score}
        teamId={team.TeamID}
      />
      <div className="w-full"></div>
    </>
  );
};

export default ScoreboardTeam;
