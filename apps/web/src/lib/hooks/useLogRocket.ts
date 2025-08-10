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
import * as Sentry from "@sentry/nextjs";
import LogRocket from "logrocket";
import { useEffect } from "react";

import { env } from "../env";

export const useLogrocket = (user?: User | null): void => {
  const isBrowser = typeof window !== "undefined";

  useEffect(() => {
    if (!isBrowser) {
      return;
    }

    LogRocket.init(env.NEXT_PUBLIC_LOGROCKET_PROJ ?? "");
    LogRocket.getSessionURL((sessionURL) => {
      Sentry.withScope((scope) => {
        scope.setExtra("sessionURL", sessionURL);
      });
    });
  }, [isBrowser]);

  useEffect((): void => {
    if (!isBrowser) {
      return;
    }

    if (user) {
      const { name, image: picture, ...rest } = user;

      LogRocket.identify(`${user.id}`, {
        name: name ?? "",
        picture: picture ?? "",
        ...rest,
      });
    }
  }, [isBrowser, user]);
};
