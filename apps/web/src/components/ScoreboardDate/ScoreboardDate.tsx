"use client";

import { cn } from "@nfl-pool-monorepo/utils/styles";
import { type FC, useEffect, useState } from "react";

import { formatDateForKickoff } from "@/lib/dates";

type Props = {
  isFirst?: boolean;
  kickoff: Date;
};

const ScoreboardDate: FC<Props> = ({ kickoff, isFirst = false }) => {
  const [localDate, setLocalDate] = useState<string | null>(null);

  useEffect(() => {
    // react-doctor-disable-next-line react-hooks-js/set-state-in-effect -- the visitor's timezone is unknown during SSR, so this can only be formatted in their local timezone once mounted, same pattern as useNow.ts
    setLocalDate(formatDateForKickoff(kickoff));
  }, [kickoff]);

  return <div className={cn("col-span-full text-left font-bold", !isFirst && "mt-3")}>{localDate}</div>;
};

export default ScoreboardDate;
