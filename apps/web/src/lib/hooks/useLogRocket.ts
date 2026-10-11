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

import type { User } from "@nfl-pool-monorepo/types";
import type LogRocketSDK from "logrocket";
import { useEffect } from "react";

import { env } from "../env.client";

const identifyUser = (LogRocket: typeof LogRocketSDK, user: User): void => {
  const { name, image: picture, ...rest } = user;

  LogRocket.identify(`${user.id}`, {
    name: name ?? "",
    picture: picture ?? "",
    ...rest,
  });
};

// Dynamically imported so the recording SDK stays out of the shared layout bundle and loads after first paint.
const startLogrocket = async (user?: User | null): Promise<void> => {
  const { default: LogRocket } = await import("logrocket");

  LogRocket.init(env.NEXT_PUBLIC_LOGROCKET_PROJ ?? "", {
    ...(env.NEXT_PUBLIC_LOGROCKET_RELEASE ? { release: env.NEXT_PUBLIC_LOGROCKET_RELEASE } : {}),
  });

  if (user) {
    identifyUser(LogRocket, user);
  }
};

export const useLogrocket = (user?: User | null): void => {
  const isBrowser = typeof window !== "undefined";

  useEffect(() => {
    if (!isBrowser) {
      return;
    }

    startLogrocket(user).catch((error) => console.error("Failed to start LogRocket", error));
  }, [isBrowser, user]);
};
