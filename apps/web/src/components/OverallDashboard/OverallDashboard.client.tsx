"use client";

import { cn } from "@nfl-pool-monorepo/utils/styles";
import "client-only";

import type { FC } from "react";

import SharedElement from "@/components/ViewTransitions/SharedElement";
import { headingHandoff, useRememberHandoff } from "@/lib/sharedElementHandoff";

const RESULTS_TITLE = "My Overall Results";

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

// Remembered so the dashboard's skeleton shows this title only when the card it comes back to has one
export const OverallDashboardResults: FC<OverallDashboardResultsProps> = ({ className }) => {
  useRememberHandoff(headingHandoff, "myOverallResultsTitle", RESULTS_TITLE);

  return (
    <SharedElement name="myOverallResultsTitle">
      <h2 className={cn("scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0", className)}>{RESULTS_TITLE}</h2>
    </SharedElement>
  );
};
