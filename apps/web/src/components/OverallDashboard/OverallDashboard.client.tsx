"use client";

import { cn } from "@nfl-pool-monorepo/utils/styles";
import "client-only";

import type { FC } from "react";

import SharedElement from "@/components/ViewTransitions/SharedElement";

export const OverallDashboardTitle: FC = () => {
  return (
    <SharedElement name="overallRankTitle">
      <h2 className="mb-0 scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">Overall Rank</h2>
    </SharedElement>
  );
};

type OverallDashboardResultsProps = {
  className: string;
};

export const OverallDashboardResults: FC<OverallDashboardResultsProps> = ({ className }) => {
  return (
    <SharedElement name="myOverallResultsTitle">
      <h2 className={cn("scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0", className)}>
        My Overall Results
      </h2>
    </SharedElement>
  );
};
