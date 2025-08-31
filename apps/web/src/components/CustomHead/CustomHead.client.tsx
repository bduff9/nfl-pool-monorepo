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
import type { FC } from "react";
import { useEffect, useRef } from "react";
import { LuCircleAlert } from "react-icons/lu";

type Props = {
  alerts: string[];
  title: string;
};

const CustomHeadClient: FC<Props> = ({ alerts, title }) => {
  const interval = useRef<number | null>(null);

  useEffect(() => {
    if (alerts.length) {
      if (interval.current) {
        window.clearInterval(interval.current);
      }

      interval.current = window.setInterval(() => {
        const currentTitle = document.title;

        document.title = currentTitle === title ? `(${alerts.length}) Alerts` : title;
      }, 2000);
    } else if (interval.current) {
      window.clearInterval(interval.current);
      document.title = title;
    }

    return () => {
      if (interval.current) window.clearInterval(interval.current);
    };
  }, [alerts, title]);

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      {alerts.map((alert) => (
        <Alert key={alert} variant="destructive">
          <LuCircleAlert />
          <AlertTitle>{alert}</AlertTitle>
        </Alert>
      ))}
    </div>
  );
};

export default CustomHeadClient;
