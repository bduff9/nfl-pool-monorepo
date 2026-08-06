"use client";

import { type DataTableFeatures, SortableColumnHeader } from "@nfl-pool-monorepo/ui/components/data-table";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { ColumnDef } from "@tanstack/react-table";

import { getPayoutStatus } from "@/lib/payoutStatus";
import type { getUserPayoutsForAdmin } from "@/server/loaders/payment";

import { BalanceCell } from "./BalanceCell";

export type Prize = Awaited<ReturnType<typeof getUserPayoutsForAdmin>>[number];

export const prizeColumns: ColumnDef<DataTableFeatures, Prize>[] = [
  {
    accessorKey: "UserName",
    cell: ({ row }) => {
      return (
        <>
          <div className="font-bold">{row.original.UserName}</div>
          <div className="text-muted-foreground font-bold">{row.original.UserTeamName}</div>
        </>
      );
    },
    header: ({ column }) => <SortableColumnHeader column={column} title="Name" />,
  },
  {
    accessorKey: "UserWon",
    cell: ({ row }) => {
      const payoutStatus = getPayoutStatus(Number(row.original.UserBalance), Number(row.original.UserWon));

      return (
        <div
          className={cn(
            "text-right font-bold",
            payoutStatus === "unpaid" && "text-red-600",
            payoutStatus === "paid" && "text-green-600 line-through",
            payoutStatus === "partial" && "text-amber-600",
          )}
          title={`Paid out $${(row.original.UserWon ?? 0) - (row.original.UserBalance ?? 0)} / $${
            row.original.UserWon
          }`}
        >
          ${row.original.UserWon ?? 0}
        </div>
      );
    },
    header: ({ column }) => <SortableColumnHeader column={column} title="Payout" />,
  },
  {
    accessorFn: (row) =>
      row.payouts
        .map((payment) => `${payment.PaymentWeek ? `Week ${payment.PaymentWeek}: ` : ""}${payment.PaymentDescription}`)
        .join(", "),
    accessorKey: "payouts",
    header: "Winnings",
  },
  {
    accessorKey: "UserPaymentType",
    cell: ({ row }) => {
      return (
        <>
          <div className="font-bold">{row.original.UserPaymentType}</div>
          <div className="text-muted-foreground">{row.original.UserPaymentAccount}</div>
        </>
      );
    },
    header: ({ column }) => <SortableColumnHeader column={column} title="Account" />,
  },
  {
    accessorKey: "UserBalance",
    cell: ({ row }) => <BalanceCell prize={row.original} />,
    header: "Mark Paid",
  },
];
