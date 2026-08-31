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

import { Draggable, Droppable } from "@hello-pangea/dnd";
import type { Games, Picks, Teams } from "@nfl-pool-monorepo/db/src";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { Selectable } from "kysely";
import type { FC } from "react";
import { FaAt, FaInfoCircle, FaTimesCircle } from "react-icons/fa";

import { getBackgroundColor } from "@/lib/strings";

import type { LoadingType } from "../MakePicksClient/MakePicksClient";
import TeamLogo from "../TeamLogo/TeamLogo";

type DraggablePointProps = {
  index?: number | undefined;
  isDragDisabled?: boolean;
  maxValue: number;
  value: number;
};

type PointProps = {
  droppableId?: string;
  isDropDisabled?: boolean;
} & DraggablePointProps;

const DraggablePoint: FC<DraggablePointProps> = ({ index, isDragDisabled = false, maxValue, value }) => {
  return (
    <Draggable draggableId={`point-${value}`} index={index ?? value} isDragDisabled={isDragDisabled}>
      {(provided, snapshot) => (
        <div
          className={cn(
            "inline-block rounded-full text-center pt-1 md:size-[60px] md:text-[2rem] size-[31px] text-base",
            isDragDisabled ? "cursor-not-allowed" : "cursor-move",
            snapshot.isDragging && "opacity-75",
          )}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            backgroundColor: getBackgroundColor(value, maxValue),
            border: `1px solid ${getBackgroundColor(value, maxValue, "#000")}`,
            ...provided.draggableProps.style,
          }}
        >
          {value || ""}
        </div>
      )}
    </Draggable>
  );
};

export const Point: FC<PointProps> = ({
  droppableId,
  index,
  isDragDisabled = false,
  isDropDisabled = false,
  maxValue,
  value,
}) => {
  if (!droppableId) {
    return <DraggablePoint index={index} isDragDisabled={isDragDisabled} maxValue={maxValue} value={value} />;
  }

  return (
    <Droppable droppableId={droppableId} isDropDisabled={isDropDisabled || !!value}>
      {(provided, snapshot) => (
        <div
          className={cn(
            "inline-block rounded-full text-center cursor-move md:size-[60px] md:text-[2rem] size-[31px] text-base",
            !value && "bg-card border border-border",
            snapshot.isDraggingOver && "bg-blue-300",
          )}
          ref={provided.innerRef}
        >
          {!value ? (
            ""
          ) : (
            <DraggablePoint index={index} isDragDisabled={isDragDisabled} maxValue={maxValue} value={value} />
          )}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

type PickTeam = Pick<Selectable<Teams>, "TeamID" | "TeamCity" | "TeamLogo" | "TeamName"> | null;

type TeamLogoButtonProps = {
  onClick: () => void;
  team: PickTeam;
};

const TeamLogoButton: FC<TeamLogoButtonProps> = ({ onClick, team }) => {
  const label = `${team?.TeamCity} ${team?.TeamName}`;

  return (
    <button
      aria-label={label}
      className={cn("cursor-pointer w-2/5 md:w-1/5 flex flex-wrap justify-center bg-transparent border-0 p-0")}
      onClick={onClick}
      type="button"
    >
      <TeamLogo size={60} team={team} />
      <div className={cn("block md:hidden decoration-dotted underline underline-offset-2")}>{team?.TeamName}</div>
    </button>
  );
};

type TeamTextButtonProps = {
  isSelected: boolean;
  onClick: () => void;
  selectedIconSide: "end" | "start";
  team: PickTeam;
  unselectedIconSide: "end" | "start";
};

const TeamTextButton: FC<TeamTextButtonProps> = ({
  isSelected,
  onClick,
  selectedIconSide,
  team,
  unselectedIconSide,
}) => {
  return (
    <button
      aria-label={`${team?.TeamCity} ${team?.TeamName}`}
      className={cn("hidden md:block relative cursor-pointer w-2/5 md:w-1/5 bg-transparent border-0 p-0 text-center")}
      onClick={onClick}
      type="button"
    >
      {team?.TeamCity}
      <br />
      {team?.TeamName}
      {isSelected ? (
        <FaTimesCircle
          className={cn(
            "absolute top-1/2 -translate-y-1/2 text-red-600",
            selectedIconSide === "start" ? "start-0" : "end-0",
          )}
        />
      ) : (
        <FaInfoCircle
          className={cn("absolute top-1/2 -translate-y-1/2", unselectedIconSide === "start" ? "start-0" : "end-0")}
        />
      )}
    </button>
  );
};

type PickGameProps = {
  dragGameID: null | string;
  gameCount: number;
  isBackgrounded?: boolean;
  loading: LoadingType | null;
  now: Date;
  onClick: () => void;
  pick: Selectable<Picks> &
    Selectable<Games> & {
      pickTeam: PickTeam;
      homeTeam: PickTeam;
      visitorTeam: PickTeam;
    };
  isSelected?: boolean;
};

const PickGame: FC<PickGameProps> = ({
  dragGameID,
  gameCount,
  isBackgrounded = false,
  isSelected = false,
  loading,
  now,
  onClick,
  pick,
}) => {
  const hasStarted = pick.GameKickoff < now;
  const hasMadePick = !!pick.pickTeam;

  return (
    <div
      className={cn(
        "flex py-3",
        hasMadePick && hasStarted && "bg-blue-600 opacity-75",
        hasMadePick && !hasStarted && "bg-blue-500",
        !hasMadePick && hasStarted && "bg-red-400",
        isBackgrounded && "opacity-65",
      )}
    >
      <div className="w-1/4 md:w-1/6 flex items-center justify-center md:justify-end">
        <Point
          droppableId={`visitor-pick-for-game-${pick.GameID}`}
          isDragDisabled={loading !== null || hasStarted}
          isDropDisabled={hasMadePick && dragGameID !== `pick-for-game-${pick.GameID}`}
          maxValue={gameCount}
          value={pick.pickTeam?.TeamID === pick.visitorTeam?.TeamID ? (pick.PickPoints ?? 0) : 0}
        />
      </div>
      <div className="w-1/2 md:w-2/3 flex items-center text-center">
        <TeamLogoButton onClick={onClick} team={pick.visitorTeam} />
        <TeamTextButton
          isSelected={isSelected}
          onClick={onClick}
          selectedIconSide="start"
          team={pick.visitorTeam}
          unselectedIconSide="start"
        />
        <div className={cn("w-1/5 flex justify-center")}>
          <FaAt />
        </div>
        <TeamTextButton
          isSelected={isSelected}
          onClick={onClick}
          selectedIconSide="start"
          team={pick.homeTeam}
          unselectedIconSide="end"
        />
        <TeamLogoButton onClick={onClick} team={pick.homeTeam} />
      </div>
      <div className="w-1/4 md:w-1/6 flex items-center justify-center md:justify-start">
        <Point
          droppableId={`home-pick-for-game-${pick.GameID}`}
          isDragDisabled={loading !== null || hasStarted}
          isDropDisabled={hasMadePick && dragGameID !== `pick-for-game-${pick.GameID}`}
          maxValue={gameCount}
          value={pick.pickTeam?.TeamID === pick.homeTeam?.TeamID ? (pick.PickPoints ?? 0) : 0}
        />
      </div>
    </div>
  );
};

export default PickGame;
