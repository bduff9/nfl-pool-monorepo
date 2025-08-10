import {
  DAYS_IN_WEEK,
  HOURS_IN_DAY,
  MILLISECONDS_IN_SECOND,
  MINUTES_IN_HOUR,
  MONTHS_IN_YEAR,
  SECONDS_IN_MINUTE,
  WEEKS_IN_MONTH,
} from "@nfl-pool-monorepo/utils/constants";

export const relativeTime = (date: Date): string => {
  const formatter = new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
    style: "long",
  });
  let diff = (date.getTime() - Date.now()) / MILLISECONDS_IN_SECOND;

  if (Math.abs(diff) < SECONDS_IN_MINUTE) {
    return formatter.format(diff, "second");
  }

  diff /= SECONDS_IN_MINUTE; // minutes

  if (Math.abs(diff) < MINUTES_IN_HOUR) {
    return formatter.format(Math.round(diff), "minute");
  }

  diff /= MINUTES_IN_HOUR; // hours

  if (Math.abs(diff) < HOURS_IN_DAY) {
    return formatter.format(Math.round(diff), "hour");
  }

  diff /= HOURS_IN_DAY; // days

  if (Math.abs(diff) < DAYS_IN_WEEK) {
    return formatter.format(Math.round(diff), "day");
  }

  diff /= DAYS_IN_WEEK; // weeks

  if (Math.abs(diff) < WEEKS_IN_MONTH) {
    return formatter.format(Math.round(diff), "week");
  }

  diff /= WEEKS_IN_MONTH; // years

  if (Math.abs(diff) < MONTHS_IN_YEAR) {
    return formatter.format(Math.round(diff), "month");
  }

  diff /= MONTHS_IN_YEAR;

  return formatter.format(Math.round(diff), "year");
};

export const stripCharacterCount = (text: string): string => {
  const index = text.search(/\[.+\]/);

  if (index < 0) {
    return text;
  }

  return text.substring(0, index);
};
