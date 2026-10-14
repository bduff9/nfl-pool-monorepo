"use client";

import "client-only";

import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { FC } from "react";

import SharedElement from "@/components/ViewTransitions/SharedElement";
import { useCountdown } from "@/lib/hooks/useCountdown";

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
  return (
    <SharedElement name="weeklyRankTitle">
      <h2 className="mb-0 scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">
        Week {selectedWeek > 0 && selectedWeek} Rank
      </h2>
    </SharedElement>
  );
};

type WeeklyDashboardResultsProps = {
  className: string;
  selectedWeek: number;
};

export const WeeklyDashboardResults: FC<WeeklyDashboardResultsProps> = ({ className, selectedWeek }) => {
  return (
    <SharedElement name="myWeeklyResultsTitle">
      <h2 className={cn("scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0", className)}>
        My Week {selectedWeek} Results
      </h2>
    </SharedElement>
  );
};
