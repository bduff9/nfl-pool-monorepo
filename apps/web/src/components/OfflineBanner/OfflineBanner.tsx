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

import { Alert, AlertTitle } from "@nfl-pool-monorepo/ui/components/alert";
import { useOffline } from "next/offline";
import type { FC } from "react";
import { LuWifiOff } from "react-icons/lu";

const OfflineBanner: FC = () => {
  const isOffline = useOffline();

  if (!isOffline) {
    return null;
  }

  return (
    <div className="w-full">
      <Alert>
        <LuWifiOff />
        <AlertTitle>You&apos;re offline. Pending actions will retry once you&apos;re back online.</AlertTitle>
      </Alert>
    </div>
  );
};

export default OfflineBanner;
