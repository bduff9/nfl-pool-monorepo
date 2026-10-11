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
import { type FC, useState } from "react";
import { FaChevronDown } from "react-icons/fa";

import ViewAllModal from "@/components/ViewAllModal/ViewAllModal";
import ViewAllTable from "@/components/ViewAllTable/ViewAllTable";
import { sortPicks } from "@/lib/arrays";
import type { getAllPicksForWeek } from "@/server/loaders/pick";
import type { getWeeklyRankings } from "@/server/loaders/weeklyMv";

import { resolveViewAllGames, updateGames } from "./viewAllGames";

type ModeButtonStyle = { className: string | undefined; variant: "outline" | "primary" };

const MODE_BUTTON_STYLES: Record<"live" | "whatIf", ModeButtonStyle> = {
  live: { className: undefined, variant: "primary" },
  whatIf: { className: "dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white", variant: "outline" },
};

type ViewModeToggleProps = {
  isLive: boolean;
  mode: string;
  onOpenModal: () => void;
  onSelectLive: () => void;
  onSelectWhatIf: () => void;
};

const ViewModeToggle: FC<ViewModeToggleProps> = ({ isLive, mode, onOpenModal, onSelectLive, onSelectWhatIf }) => {
  const { className, variant } = MODE_BUTTON_STYLES[isLive ? "live" : "whatIf"];

  return (
    <div className="inline-flex rounded-md shadow-sm overflow-hidden">
      <Button
        className={cn("px-7 text-nowrap grow shrink-0 rounded-none", className)}
        disabled={isLive}
        onClick={onOpenModal}
        variant={variant}
      >
        {mode}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label="Choose view mode"
            className={cn("flex-grow-0 flex-shrink rounded-none border-l border-border px-2", className)}
            variant={variant}
          >
            <FaChevronDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onSelectLive}>Live Results</DropdownMenuItem>
          <DropdownMenuItem onClick={onSelectWhatIf}>What If</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

type Props = {
  currentUserId: number;
  gamesForWeek: Awaited<ReturnType<typeof getGamesForWeek>>;
  picksForWeek: Awaited<ReturnType<typeof getAllPicksForWeek>>;
  weeklyRankings: Awaited<ReturnType<typeof getWeeklyRankings>>;
};

const ViewAllPicksClient: FC<Props> = ({ currentUserId, gamesForWeek, picksForWeek, weeklyRankings }) => {
  const [mode, setMode] = useState<"Live Results" | "What If">("Live Results");
  const [customGames, setCustomGames] = useState<Record<
    number,
    Awaited<ReturnType<typeof getGamesForWeek>>[number]
  > | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const isLive = mode === "Live Results";
  const { games, isShowingCustomGames } = resolveViewAllGames({ customGames, gamesForWeek, isLive });

  const saveModalChanges = (updatedGames: Awaited<ReturnType<typeof getGamesForWeek>>): void => {
    setCustomGames(updateGames(updatedGames));
    setIsModalOpen(false);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleSelectLiveResultsMode = () => {
    setMode("Live Results");
    setCustomGames(null);
  };

  const handleSelectWhatIfMode = () => {
    setMode("What If");
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-dvh">
      <div className="w-full text-center md:text-start">
        Current Viewing Mode
        <br />
        <ViewModeToggle
          isLive={isLive}
          mode={mode}
          onOpenModal={handleOpenModal}
          onSelectLive={handleSelectLiveResultsMode}
          onSelectWhatIf={handleSelectWhatIfMode}
        />
      </div>
      <div className="w-full">
        <ViewAllTable
          currentUserId={currentUserId}
          games={games}
          picks={picksForWeek}
          ranks={isShowingCustomGames ? sortPicks(picksForWeek, games, weeklyRankings) : weeklyRankings}
        />
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
