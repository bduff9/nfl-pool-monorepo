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

import "client-only";

import type { getGamesForWeek } from "@nfl-pool-monorepo/db/src/queries/game";
import { Button } from "@nfl-pool-monorepo/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@nfl-pool-monorepo/ui/components/dialog";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import Image from "next/image";
import { type FC, useCallback, useEffect, useState } from "react";
import { PiAtDuotone } from "react-icons/pi";

import { getAbbreviation } from "@/lib/strings";

type Props = {
  closeModal: (open: boolean) => void;
  games: Awaited<ReturnType<typeof getGamesForWeek>>;
  isOpen: boolean;
  saveChanges: (games: Awaited<ReturnType<typeof getGamesForWeek>>) => void;
};

type TeamWinnerButtonProps = {
  gameID: number;
  isSelected: boolean;
  onSelectWinner: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, gameID: number, teamID: number) => void;
  team: Awaited<ReturnType<typeof getGamesForWeek>>[number]["visitorTeam"];
  teamID: number;
};

const TeamWinnerButton: FC<TeamWinnerButtonProps> = ({ gameID, isSelected, onSelectWinner, team, teamID }) => {
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      onSelectWinner(event, gameID, teamID);
    },
    [onSelectWinner, gameID, teamID],
  );

  return (
    <button
      aria-label={`${team?.TeamCity} ${team?.TeamName}`}
      className={cn(
        "rounded-full size-[90px] mx-auto border-0 p-0",
        isSelected
          ? "cursor-default bg-blue-300 border-blue-500 border-4"
          : "cursor-pointer hover:bg-blue-100 hover:border-blue-300 hover:border-4 hover:text-blue-900",
      )}
      onClick={handleClick}
      type="button"
    >
      <Image
        alt={`${team?.TeamCity} ${team?.TeamName}`}
        className="mx-auto"
        height={50}
        src={`/NFLLogos/${team?.TeamLogo}`}
        title={`${team?.TeamCity} ${team?.TeamName}`}
        width={50}
      />
      {team?.TeamName.includes(" ") ? <div>{getAbbreviation(team?.TeamName)}</div> : <div>{team?.TeamName}</div>}
    </button>
  );
};

const ViewAllModal: FC<Props> = ({ closeModal, games, isOpen, saveChanges }) => {
  const [customGames, setCustomGames] = useState<Awaited<ReturnType<typeof getGamesForWeek>>>(() => games);

  useEffect(() => {
    // Radix Dialog leaves body pointer-events disabled briefly after close; re-enable/disable on a delay
    // to match its own close animation instead of fighting it. See https://github.com/radix-ui/primitives/issues/1241
    let timer: NodeJS.Timeout;

    if (isOpen) {
      timer = setTimeout(() => {
        document.body.style.pointerEvents = "";
      }, 0);
    } else {
      timer = setTimeout(() => {
        document.body.style.pointerEvents = "auto";
      }, 1500);
    }

    return () => clearTimeout(timer);
  }, [isOpen]);

  const selectWinner = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    gameID: number,
    teamID: number,
  ): void => {
    event.stopPropagation();

    const newCustomGames = customGames.map((game) => {
      if (game.GameID !== gameID) return game;

      return { ...game, WinnerTeamID: teamID };
    });

    setCustomGames(newCustomGames);
  };

  const handleSaveClick = useCallback(() => {
    saveChanges(customGames);
  }, [customGames, saveChanges]);

  return (
    <Dialog onOpenChange={closeModal} open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">What If Version</DialogTitle>
          <DialogDescription className="text-center">
            Click a team logo to view the updated ranks in a &ldquo;What If&rdquo; version if that team were to win.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[50vh]">
          {customGames.map((game) => (
            <div className="flex justify-around items-center text-center" key={`what-if-for-game-${game.GameID}`}>
              <div className={cn("w-5/12")}>
                <TeamWinnerButton
                  gameID={game.GameID}
                  isSelected={game.WinnerTeamID === game.VisitorTeamID}
                  onSelectWinner={selectWinner}
                  team={game.visitorTeam}
                  teamID={game.VisitorTeamID}
                />
              </div>
              <div className="w-1/6">
                <PiAtDuotone className="mx-auto" />
              </div>
              <div className={cn("w-5/12")}>
                <TeamWinnerButton
                  gameID={game.GameID}
                  isSelected={game.WinnerTeamID === game.HomeTeamID}
                  onSelectWinner={selectWinner}
                  team={game.homeTeam}
                  teamID={game.HomeTeamID}
                />
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
          <Button onClick={handleSaveClick} type="button" variant="primary">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewAllModal;
