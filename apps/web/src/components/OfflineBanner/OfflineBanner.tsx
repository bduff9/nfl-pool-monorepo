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

import { type FC, useState } from "react";
import { LuWifiOff } from "react-icons/lu";

import { useIsOffline, useLastSynced } from "@/lib/hooks/useIsOffline";

const formatSynced = (at: number): string => {
  const date = new Date(at);
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return date.toDateString() === new Date().toDateString()
    ? time
    : `${date.toLocaleDateString([], { day: "numeric", month: "short" })} ${time}`;
};

// A small pill pinned to the top of the screen so it is visible from any scroll position. It slides down from under the
// status bar when the connection drops and back up when it returns (see .offline-banner in globals.css), so it stays
// mounted, hidden, once it has been shown.
const OfflineBanner: FC = () => {
  const isOffline = useIsOffline();
  const lastSynced = useLastSynced();
  const [hasBeenOffline, setHasBeenOffline] = useState<boolean>(false);

  if (isOffline && !hasBeenOffline) {
    setHasBeenOffline(true);
  }

  if (!hasBeenOffline) {
    return null;
  }

  return (
    <div
      aria-hidden={!isOffline}
      className="offline-banner pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+0.25rem)] z-[70] flex justify-center px-2"
      data-state={isOffline ? "open" : "closed"}
      style={isOffline ? { viewTransitionName: "offline-banner" } : undefined}
    >
      <div
        aria-live="polite"
        className="pointer-events-auto flex items-center gap-2 rounded-full border border-amber-500/60 bg-black/85 px-3 py-1 text-sm text-amber-300 shadow-lg backdrop-blur"
        role="status"
      >
        <LuWifiOff aria-hidden="true" className="size-4 shrink-0" />
        <span>Offline · {lastSynced ? `saved ${formatSynced(lastSynced)}` : "showing saved data"}</span>
      </div>
    </div>
  );
};

export default OfflineBanner;
