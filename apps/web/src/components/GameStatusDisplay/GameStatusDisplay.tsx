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

import { type FC, type ReactNode, useEffect, useState, ViewTransition } from "react";

import { formatTimeFromKickoff } from "@/lib/dates";
import { REFRESH_TRANSITION } from "@/lib/refreshTransition";
import { getShortQuarter } from "@/lib/strings";
import type { getGamesForWeekCached } from "@/server/loaders/game";

type GameStatusDisplayProps = {
  kickoff: Date;
  gameStatus: Awaited<ReturnType<typeof getGamesForWeekCached>>[number]["GameStatus"];
  timeLeft: string;
  /** True when the score/clock come from the live overlay rather than the official data. */
  isLive?: boolean;
};

// An overlaid "Final" came from the live feed before the official result, so it is labelled unofficial. A game still
// being played gets a softly pulsing dot, like a recording light.
const LiveBadge: FC<{ gameStatus: string; isLive: boolean }> = ({ gameStatus, isLive }) =>
  isLive ? (
    <span className="block text-xs font-bold tracking-wide text-red-600 dark:text-red-400">
      {gameStatus === "Final" ? (
        "UNOFFICIAL"
      ) : (
        <>
          <span
            aria-hidden
            className="me-1 inline-block size-1.5 rounded-full bg-current align-middle motion-safe:animate-pulse"
          />
          LIVE
        </>
      )}
    </span>
  ) : null;

// Render with a key: when a live refresh changes it (kickoff, a new quarter, half time, final, the live badge turning
// unofficial), the old text crossfades into the new (status-in/status-out in globals.css). The clock ticking within a
// quarter just updates in place.
const StatusFade: FC<{ children: ReactNode }> = ({ children }) => (
  <ViewTransition
    default="none"
    enter={{ default: "none", [REFRESH_TRANSITION]: "status-in" }}
    exit={{ default: "none", [REFRESH_TRANSITION]: "status-out" }}
  >
    {children}
  </ViewTransition>
);

type InProgressStatusProps = Pick<GameStatusDisplayProps, "gameStatus" | "timeLeft">;

const InProgressStatus: FC<InProgressStatusProps> = ({ gameStatus, timeLeft }) => (
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

const GameStatusDisplay: FC<GameStatusDisplayProps> = ({ kickoff, gameStatus, timeLeft, isLive = false }) => {
  const [localKickoffTime, setLocalKickoffTime] = useState<string | null>(null);

  useEffect(() => {
    // react-doctor-disable-next-line react-hooks-js/set-state-in-effect -- the visitor's timezone is unknown during SSR, so this can only be formatted in their local timezone once mounted, same pattern as useNow.ts
    setLocalKickoffTime(formatTimeFromKickoff(kickoff));
  }, [kickoff]);

  return (
    <>
      <StatusFade key={isLive ? `live-${gameStatus === "Final"}` : "official"}>
        <LiveBadge gameStatus={gameStatus} isLive={isLive} />
      </StatusFade>
      <StatusFade key={gameStatus}>
        <div>
          {gameStatus === "Pregame" && localKickoffTime}
          {gameStatus === "Final" && gameStatus}
          {gameStatus !== "Pregame" && gameStatus !== "Final" && (
            <InProgressStatus gameStatus={gameStatus} timeLeft={timeLeft} />
          )}
        </div>
      </StatusFade>
    </>
  );
};

export default GameStatusDisplay;
