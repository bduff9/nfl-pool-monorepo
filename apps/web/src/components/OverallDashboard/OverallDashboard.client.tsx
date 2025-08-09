"use client";

import { cn } from "@nfl-pool-monorepo/utils/styles";
import "client-only";

import { motion } from "framer-motion";
import type { FC } from "react";

export const OverallDashboardTitle: FC = () => {
  return (
    <motion.h2
      className="mb-0 scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0"
      layoutId="overallRankTitle"
    >
      Overall Rank
    </motion.h2>
  );
};

type OverallDashboardResultsProps = {
  className: string;
};

export const OverallDashboardResults: FC<OverallDashboardResultsProps> = ({ className }) => {
  return (
    <motion.h2
      className={cn("scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0", className)}
      layoutId="myOverallResultsTitle"
    >
      My Overall Results
    </motion.h2>
  );
};
