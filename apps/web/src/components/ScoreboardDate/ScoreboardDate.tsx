"use client";

import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { FC } from "react";

import { formatDateForKickoff } from "@/lib/dates";

type Props = {
  isFirst?: boolean;
  kickoff: Date;
};

const ScoreboardDate: FC<Props> = ({ kickoff, isFirst = false }) => {
  return (
    <div className={cn("col-span-full text-left font-bold", !isFirst && "mt-3")}>{formatDateForKickoff(kickoff)}</div>
  );
};

export default ScoreboardDate;
