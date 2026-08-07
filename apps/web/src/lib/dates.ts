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
import {
  HOURS_IN_DAY,
  MILLISECONDS_IN_SECOND,
  MINUTES_IN_HOUR,
  SECONDS_IN_MINUTE,
} from "@nfl-pool-monorepo/utils/constants";

export const formatDateForBackup = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    weekday: "long",
  };

  return date.toLocaleDateString("en-US", options);
};

export const formatDateForKickoff = (date: Date | string): string => {
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    weekday: "long",
  };
  const toFormat = new Date(date);

  return toFormat.toLocaleDateString("en-US", options);
};

export const formatTimeFromKickoff = (date: Date | string): string => {
  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  };
  const toFormat = new Date(date);

  return toFormat.toLocaleTimeString("en-US", options);
};

/**
 * Formats a timestamp for admin-only audit tables (logs, emails, API calls). Pinned to Chicago
 * time since both admins are there - fixed rather than viewer-local avoids the SSR/hydration
 * mismatch a per-viewer timezone would need a client-only render pass to avoid.
 */
export const formatAdminTimestamp = (date: Date | string): string => {
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    second: "2-digit",
    timeZone: "America/Chicago",
    timeZoneName: "short",
    year: "numeric",
  };

  return new Date(date).toLocaleString("en-US", options);
};

type TimeParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
};

export const getTimeRemaining = (end: Date): TimeParts => {
  const now = new Date();
  const total = end.getTime() - now.getTime();
  const seconds = Math.floor((total / MILLISECONDS_IN_SECOND) % SECONDS_IN_MINUTE);
  const minutes = Math.floor((total / (MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE)) % MINUTES_IN_HOUR);
  const hours = Math.floor((total / (MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE * MINUTES_IN_HOUR)) % HOURS_IN_DAY);
  const days = Math.floor(total / (MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE * MINUTES_IN_HOUR * HOURS_IN_DAY));

  return {
    days,
    hours,
    minutes,
    seconds,
    total,
  };
};

const pluralize = (value: number, unit: string): string => `${value} ${unit}${value === 1 ? "" : "s"}`;

export const getTimeRemainingString = ({ days, hours, minutes, seconds, total }: TimeParts): string => {
  if (total <= 0) {
    return "";
  }

  let remaining = "";
  let hasParts = 0;

  if (days > 0) {
    remaining += `${pluralize(days, "day")}, `;
    hasParts++;
  }

  if ((hours > 0 || hasParts > 0) && hasParts < 2) {
    remaining += `${pluralize(hours, "hour")}, `;
    hasParts++;
  }

  if ((minutes > 0 || hasParts > 0) && hasParts < 2) {
    remaining += `${pluralize(minutes, "minute")}, `;
    hasParts++;
  }

  if ((seconds > 0 || hasParts > 0) && hasParts < 2) {
    remaining += `${pluralize(seconds, "second")}, `;
    hasParts++;
  }

  return `${remaining.substring(0, remaining.length - 2)} remaining`;
};
