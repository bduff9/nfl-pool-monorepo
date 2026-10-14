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
import { type FC, ViewTransition } from "react";
import { FaAt, FaInfoCircle, FaTimesCircle } from "react-icons/fa";

import { getBackgroundColor, getForegroundColor } from "@/lib/strings";

import type { LoadingType } from "../MakePicksClient/MakePicksClient";
import { PICK_POINTS_TRANSITION } from "../MakePicksClient/pickPlacement";
import TeamLogo from "../TeamLogo/TeamLogo";
import { formatSpread, type SpreadValue } from "./formatSpread";

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

// Each point value is on screen once, in the bank or on a game, so a reset or an auto pick moves the chip itself from one
// to the other. A week change remounts the board (see WeekTransition), so the week types keep the chips in the week slide.
const POINT_SHARE = { default: "pick-point", "week-back": "none", "week-forward": "none" } as const;
// The chips that stay put in the bank only make room in a reset (or its rollback). Every other transition re-renders them
// with new props, so a default update would start an empty view transition on each save's refresh and hold the screen.
const POINT_UPDATE = { default: "none", [PICK_POINTS_TRANSITION]: "pick-point" } as const;

const DraggablePoint: FC<DraggablePointProps> = ({ index, isDragDisabled = false, maxValue, value }) => {
  return (
    <Draggable draggableId={`point-${value}`} index={index ?? value} isDragDisabled={isDragDisabled}>
      {(provided, snapshot) => (
        <ViewTransition default="none" name={`pick-point-${value}`} share={POINT_SHARE} update={POINT_UPDATE}>
          <div
            className={cn(
              "inline-block rounded-full text-center pt-1 md:size-[60px] md:text-[2rem] size-10 text-lg",
              isDragDisabled ? "cursor-not-allowed" : "cursor-move",
              snapshot.isDragging && "opacity-75",
            )}
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{
              backgroundColor: getBackgroundColor(value, maxValue),
              border: `1px solid ${getBackgroundColor(value, maxValue, "#000")}`,
              color: getForegroundColor(value, maxValue),
              ...provided.draggableProps.style,
            }}
          >
            {value || ""}
          </div>
        </ViewTransition>
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
            "relative inline-block rounded-full text-center cursor-move md:size-[60px] md:text-[2rem] size-10 text-lg",
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
          {/* Slots hold a single point, so the placeholder must not take layout space and shift the row while hovering */}
          <div className="absolute size-0 overflow-hidden">{provided.placeholder}</div>
        </div>
      )}
    </Droppable>
  );
};

type PickTeam = Pick<Selectable<Teams>, "TeamID" | "TeamCity" | "TeamLogo" | "TeamName"> | null;

const getTeamLabel = (team: PickTeam): string => `${team?.TeamCity} ${team?.TeamName}`;

const Spread: FC<{ className: string; spread: SpreadValue }> = ({ className, spread }) => {
  const formattedSpread = formatSpread(spread);

  return formattedSpread === null ? null : <div className={className}>{formattedSpread}</div>;
};

const SIDE_CLASSES = { end: "end-0", start: "start-0" } as const;

const TeamIcon: FC<Pick<TeamTextButtonProps, "isSelected" | "selectedIconSide" | "unselectedIconSide">> = ({
  isSelected,
  selectedIconSide,
  unselectedIconSide,
}) =>
  isSelected ? (
    <FaTimesCircle className={cn("absolute top-1/2 -translate-y-1/2 text-red-600", SIDE_CLASSES[selectedIconSide])} />
  ) : (
    <FaInfoCircle className={cn("absolute top-1/2 -translate-y-1/2", SIDE_CLASSES[unselectedIconSide])} />
  );

type TeamLogoButtonProps = {
  onClick: () => void;
  spread: SpreadValue;
  team: PickTeam;
};

const TeamLogoButton: FC<TeamLogoButtonProps> = ({ onClick, spread, team }) => {
  return (
    <button
      aria-label={getTeamLabel(team)}
      className={cn("cursor-pointer w-2/5 md:w-1/5 flex flex-col items-center bg-transparent border-0 p-0")}
      data-pressable="scale"
      onClick={onClick}
      type="button"
    >
      <TeamLogo size={60} team={team} />
      <div className={cn("block md:hidden decoration-dotted underline underline-offset-2")}>{team?.TeamName}</div>
      <Spread className={cn("block md:hidden text-xs text-muted-foreground")} spread={spread} />
    </button>
  );
};

type TeamTextButtonProps = {
  isSelected: boolean;
  onClick: () => void;
  selectedIconSide: "end" | "start";
  spread: SpreadValue;
  team: PickTeam;
  unselectedIconSide: "end" | "start";
};

const TeamTextButton: FC<TeamTextButtonProps> = ({
  isSelected,
  onClick,
  selectedIconSide,
  spread,
  team,
  unselectedIconSide,
}) => {
  return (
    <button
      aria-label={getTeamLabel(team)}
      className={cn("hidden md:block relative cursor-pointer w-2/5 md:w-1/5 bg-transparent border-0 p-0 text-center")}
      data-pressable="scale"
      onClick={onClick}
      type="button"
    >
      {team?.TeamCity}
      <br />
      {team?.TeamName}
      <Spread className="text-xs text-muted-foreground" spread={spread} />
      <TeamIcon isSelected={isSelected} selectedIconSide={selectedIconSide} unselectedIconSide={unselectedIconSide} />
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

const ROW_BACKGROUNDS = {
  "false-false": "",
  "false-true": "bg-red-400",
  "true-false": "bg-blue-500",
  "true-true": "bg-blue-600 opacity-75",
} as const;

const getRowClassName = (hasMadePick: boolean, hasStarted: boolean, isBackgrounded: boolean): string =>
  cn(
    "flex py-3 motion-safe:transition-opacity motion-safe:duration-(--duration-enter)",
    ROW_BACKGROUNDS[`${hasMadePick}-${hasStarted}`],
    isBackgrounded && "opacity-65",
  );

const getTeamID = (team: PickTeam): number | undefined => team?.TeamID;

// The points placed on a team, or 0 when the pick is for the other team
const getPointsForTeam = (pick: PickGameProps["pick"], team: PickTeam): number =>
  getTeamID(pick.pickTeam) === getTeamID(team) ? (pick.PickPoints ?? 0) : 0;

type PickSlotProps = {
  dragGameID: null | string;
  gameCount: number;
  isDragDisabled: boolean;
  pick: PickGameProps["pick"];
  side: "home" | "visitor";
};

const PickSlot: FC<PickSlotProps> = ({ dragGameID, gameCount, isDragDisabled, pick, side }) => {
  const hasMadePick = !!pick.pickTeam;

  return (
    <Point
      droppableId={`${side}-pick-for-game-${pick.GameID}`}
      isDragDisabled={isDragDisabled}
      isDropDisabled={hasMadePick && dragGameID !== `pick-for-game-${pick.GameID}`}
      maxValue={gameCount}
      value={getPointsForTeam(pick, side === "home" ? pick.homeTeam : pick.visitorTeam)}
    />
  );
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
  const isDragDisabled = loading !== null || hasStarted;

  return (
    <div className={getRowClassName(hasMadePick, hasStarted, isBackgrounded)}>
      <div className="w-1/4 md:w-1/6 flex items-center justify-center md:justify-end">
        <PickSlot
          dragGameID={dragGameID}
          gameCount={gameCount}
          isDragDisabled={isDragDisabled}
          pick={pick}
          side="visitor"
        />
      </div>
      <div className="w-1/2 md:w-2/3 flex items-center text-center">
        <TeamLogoButton onClick={onClick} spread={pick.GameVisitorSpread} team={pick.visitorTeam} />
        <TeamTextButton
          isSelected={isSelected}
          onClick={onClick}
          selectedIconSide="start"
          spread={pick.GameVisitorSpread}
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
          spread={pick.GameHomeSpread}
          team={pick.homeTeam}
          unselectedIconSide="end"
        />
        <TeamLogoButton onClick={onClick} spread={pick.GameHomeSpread} team={pick.homeTeam} />
      </div>
      <div className="w-1/4 md:w-1/6 flex items-center justify-center md:justify-start">
        <PickSlot
          dragGameID={dragGameID}
          gameCount={gameCount}
          isDragDisabled={isDragDisabled}
          pick={pick}
          side="home"
        />
      </div>
    </div>
  );
};

export default PickGame;
