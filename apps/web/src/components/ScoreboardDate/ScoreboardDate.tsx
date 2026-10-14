"use client";

import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { FC } from "react";

import { formatDateForKickoff } from "@/lib/dates";
import { useIsClient } from "@/lib/hooks/useIsClient";

type Props = {
  isFirst?: boolean;
  kickoff: Date;
};

const ScoreboardDate: FC<Props> = ({ kickoff, isFirst = false }) => {
  // The visitor's timezone is unknown while server rendering and hydrating, so the date is only formatted after that
  const localDate = useIsClient() ? formatDateForKickoff(kickoff) : null;

  return <div className={cn("col-span-full text-left font-bold", !isFirst && "mt-3")}>{localDate}</div>;
};

export default ScoreboardDate;
