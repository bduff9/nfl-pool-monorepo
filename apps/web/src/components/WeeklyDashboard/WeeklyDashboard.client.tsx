"use client";

import "client-only";

import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { FC } from "react";

import SharedElement from "@/components/ViewTransitions/SharedElement";
import { useCountdown } from "@/lib/hooks/useCountdown";
import { headingHandoff, useRememberHandoff } from "@/lib/sharedElementHandoff";

type WeeklyDashboardCountdownProps = {
  weekStart: Date;
};

export const WeeklyDashboardCountdown: FC<WeeklyDashboardCountdownProps> = ({ weekStart }) => {
  const timeRemaining = useCountdown(weekStart);

  return (
    <h3 className="mt-5 scroll-m-20 text-2xl font-semibold tracking-tight">{timeRemaining || "Week has started"}</h3>
  );
};

type WeeklyDashboardTitleProps = {
  selectedWeek: number;
};

export const WeeklyDashboardTitle: FC<WeeklyDashboardTitleProps> = ({ selectedWeek }) => {
  const text = selectedWeek > 0 ? `Week ${selectedWeek} Rank` : "Week Rank";

  useRememberHandoff(headingHandoff, "weeklyRankTitle", text);

  return (
    <SharedElement name="weeklyRankTitle">
      <h2 className="mb-0 scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">{text}</h2>
    </SharedElement>
  );
};

type WeeklyDashboardResultsProps = {
  className: string;
  selectedWeek: number;
};

export const WeeklyDashboardResults: FC<WeeklyDashboardResultsProps> = ({ className, selectedWeek }) => {
  const text = `My Week ${selectedWeek} Results`;

  useRememberHandoff(headingHandoff, "myWeeklyResultsTitle", text);

  return (
    <SharedElement name="myWeeklyResultsTitle">
      <h2 className={cn("scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0", className)}>{text}</h2>
    </SharedElement>
  );
};
