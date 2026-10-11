"use client";

import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { FC } from "react";

import { getPayoutStatus } from "@/lib/payoutStatus";

import type { Prize } from "./AdminPayoutColumns";
import { getPayoutTitle, PAYOUT_STATUS_CLASS } from "./payoutCellFormat";

export const PayoutCell: FC<{ prize: Prize }> = ({ prize }) => {
  const payoutStatus = getPayoutStatus(Number(prize.UserBalance), Number(prize.UserWon));

  return (
    <div
      className={cn("text-right font-bold", PAYOUT_STATUS_CLASS[payoutStatus])}
      title={getPayoutTitle(prize.UserWon, prize.UserBalance)}
    >
      ${prize.UserWon ?? 0}
    </div>
  );
};
