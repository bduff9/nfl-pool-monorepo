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
import type { Dispatch, FC, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { PiAtDuotone } from "react-icons/pi";

import { getAbbreviation } from "@/lib/strings";

type Props = {
  closeModal: Dispatch<SetStateAction<boolean>>;
  games: Awaited<ReturnType<typeof getGamesForWeek>>;
  isOpen?: boolean;
  saveChanges: (games: Awaited<ReturnType<typeof getGamesForWeek>>) => void;
};

const ViewAllModal: FC<Props> = ({ closeModal, games, isOpen = false, saveChanges }) => {
  const [customGames, setCustomGames] = useState<Awaited<ReturnType<typeof getGamesForWeek>>>([]);

  useEffect(() => {
    if (customGames.length === 0) {
      setCustomGames(games);
    }
  }, [customGames, games]);

  const selectWinner = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent> | React.KeyboardEvent<HTMLDivElement>,
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

  return (
    <Dialog onOpenChange={closeModal} open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">What If Version</DialogTitle>
          <DialogDescription className="text-center">
            Click a team logo to view the updated ranks in a &ldquo;What If&rdquo; version if that team were to win.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[70vh]">
          {customGames.map((game) => (
            <div className="flex justify-around items-center text-center" key={`what-if-for-game-${game.GameID}`}>
              <div className={cn("w-5/12")}>
                {/** biome-ignore lint/a11y/noStaticElementInteractions: We need this to be interactive */}
                <div
                  className={cn(
                    "rounded-full size-[90px] mx-auto",
                    game.WinnerTeamID === game.VisitorTeamID
                      ? "cursor-default bg-blue-300 border-blue-500 border-4"
                      : "cursor-pointer hover:bg-blue-100 hover:border-blue-300 hover:border-4",
                  )}
                  onClick={(event) => selectWinner(event, game.GameID, game.VisitorTeamID)}
                  onKeyDown={(event) => selectWinner(event, game.GameID, game.VisitorTeamID)}
                >
                  <Image
                    alt={`${game.visitorTeam?.TeamCity} ${game.visitorTeam?.TeamName}`}
                    className="mx-auto"
                    height={50}
                    src={`/NFLLogos/${game.visitorTeam?.TeamLogo}`}
                    title={`${game.visitorTeam?.TeamCity} ${game.visitorTeam?.TeamName}`}
                    width={50}
                  />
                  {game.visitorTeam?.TeamName.includes(" ") ? (
                    <div>{getAbbreviation(game.visitorTeam?.TeamName)}</div>
                  ) : (
                    <div>{game.visitorTeam?.TeamName}</div>
                  )}
                </div>
              </div>
              <div className="w-1/6">
                <PiAtDuotone className="mx-auto" />
              </div>
              <div className={cn("w-5/12")}>
                {/** biome-ignore lint/a11y/noStaticElementInteractions: We need this to be interative */}
                <div
                  className={cn(
                    "rounded-full size-[90px] mx-auto",
                    game.WinnerTeamID === game.HomeTeamID
                      ? "cursor-default bg-blue-300 border-blue-500 border-4"
                      : "cursor-pointer hover:bg-blue-100 hover:border-blue-300 hover:border-4",
                  )}
                  onClick={(event) => selectWinner(event, game.GameID, game.HomeTeamID)}
                  onKeyDown={(event) => selectWinner(event, game.GameID, game.HomeTeamID)}
                >
                  <Image
                    alt={`${game.homeTeam?.TeamCity} ${game.homeTeam?.TeamName}`}
                    className="mx-auto"
                    height={50}
                    src={`/NFLLogos/${game.homeTeam?.TeamLogo}`}
                    title={`${game.homeTeam?.TeamCity} ${game.homeTeam?.TeamName}`}
                    width={50}
                  />
                  {game.homeTeam?.TeamName.includes(" ") ? (
                    <div>{getAbbreviation(game.homeTeam?.TeamName)}</div>
                  ) : (
                    <div>{game.homeTeam?.TeamName}</div>
                  )}
                </div>
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
          <Button onClick={() => saveChanges(customGames)} type="button" variant="primary">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewAllModal;
