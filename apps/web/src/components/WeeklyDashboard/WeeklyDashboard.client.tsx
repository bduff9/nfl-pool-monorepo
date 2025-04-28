"use client";

import "client-only";
import { motion } from "framer-motion";
import type { FC } from "react";

import { useCountdown } from "@/lib/hooks/useCountdown";

type WeeklyDashboardCountdownProps = {
  weekStart: Date;
};

export const WeeklyDashboardCountdown: FC<WeeklyDashboardCountdownProps> = ({ weekStart }) => {
  const timeRemaining = useCountdown(weekStart);

  return <h3 className="mt-5">{timeRemaining || "Week has started"}</h3>;
};

type WeeklyDashboardTitleProps = {
  selectedWeek: number;
};

export const WeeklyDashboardTitle: FC<WeeklyDashboardTitleProps> = ({ selectedWeek }) => {
  return (
    <motion.h2 className="mb-0" layoutId="weeklyRankTitle">
      Week {selectedWeek > 0 && selectedWeek} Rank
    </motion.h2>
  );
};

type WeeklyDashboardResultsProps = {
  className: string;
  selectedWeek: number;
};

export const WeeklyDashboardResults: FC<WeeklyDashboardResultsProps> = ({ className, selectedWeek }) => {
  return (
    <motion.h2 className={className} layoutId="myWeeklyResultsTitle">
      My Week {selectedWeek} Results
    </motion.h2>
  );
};
