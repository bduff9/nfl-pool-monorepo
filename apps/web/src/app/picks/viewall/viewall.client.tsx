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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@nfl-pool-monorepo/ui/components/dropdown-menu";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { FC } from "react";
import { useState } from "react";
import { FaChevronDown } from "react-icons/fa";

import ViewAllModal from "@/components/ViewAllModal/ViewAllModal";
import ViewAllTable from "@/components/ViewAllTable/ViewAllTable";
import { sortPicks } from "@/lib/arrays";
import type { getAllPicksForWeek } from "@/server/loaders/pick";
import type { getWeeklyRankings } from "@/server/loaders/weeklyMv";

const updateGames = (games: Awaited<ReturnType<typeof getGamesForWeek>>) => {
  const gamesMap = games.reduce(
    (acc, game) => {
      const gameID = game.GameID;

      if (!acc[gameID]) {
        acc[gameID] = game;
      }

      return acc;
    },
    {} as Record<number, Awaited<ReturnType<typeof getGamesForWeek>>[number]>,
  );

  return gamesMap;
};

type Props = {
  gamesForWeek: Awaited<ReturnType<typeof getGamesForWeek>>;
  picksForWeek: Awaited<ReturnType<typeof getAllPicksForWeek>>;
  weeklyRankings: Awaited<ReturnType<typeof getWeeklyRankings>>;
};

const ViewAllPicksClient: FC<Props> = ({ gamesForWeek, picksForWeek, weeklyRankings }) => {
  const [mode, setMode] = useState<"Live Results" | "What If">("Live Results");
  const [games, setGames] = useState<Record<number, Awaited<ReturnType<typeof getGamesForWeek>>[number]>>(
    updateGames(gamesForWeek),
  );
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [hasWhatIfBeenSet, setHasWhatIfBeenSet] = useState<boolean>(false);

  const isLive = mode === "Live Results";

  const saveModalChanges = (customGames: Awaited<ReturnType<typeof getGamesForWeek>>): void => {
    setGames(updateGames(customGames));
    setIsModalOpen(false);
    setHasWhatIfBeenSet(true);
  };

  return (
    <div className="row min-vh-100">
      <div className="col-12 text-center text-md-start">
        Current Viewing Mode
        <br />
        <div className="inline-flex rounded-md shadow-sm overflow-hidden">
          <Button
            className={cn(
              "px-7 text-nowrap flex-grow flex-shrink-0 rounded-none",
              !isLive && "dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white",
            )}
            disabled={isLive}
            onClick={() => setIsModalOpen(true)}
            variant={isLive ? "primary" : "outline"}
          >
            {mode}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className={cn(
                  "flex-grow-0 flex-shrink rounded-none border-l border-gray-300 px-2",
                  !isLive && "dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white",
                )}
                variant={isLive ? "primary" : "outline"}
              >
                <FaChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setMode("Live Results");
                  setHasWhatIfBeenSet(false);
                  updateGames(gamesForWeek);
                }}
              >
                Live Results
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setMode("What If");
                  setIsModalOpen(true);
                }}
              >
                What If
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="col-12">
        {isLive || !hasWhatIfBeenSet ? (
          <ViewAllTable games={games} picks={picksForWeek} ranks={weeklyRankings} />
        ) : (
          <ViewAllTable games={games} picks={picksForWeek} ranks={sortPicks(picksForWeek, games, weeklyRankings)} />
        )}
      </div>
      {!isLive && (
        <ViewAllModal
          closeModal={setIsModalOpen}
          games={gamesForWeek}
          isOpen={isModalOpen}
          saveChanges={saveModalChanges}
        />
      )}
    </div>
  );
};

export default ViewAllPicksClient;
