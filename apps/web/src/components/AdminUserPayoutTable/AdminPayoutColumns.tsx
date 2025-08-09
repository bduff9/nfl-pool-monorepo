"use client";

import { SortableColumnHeader } from "@nfl-pool-monorepo/ui/components/data-table";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { FaDollarSign } from "react-icons/fa";
import { toast } from "sonner";

import { processFormState } from "@/lib/zsa";
import { insertUserPayout } from "@/server/actions/payment";
import type { getUserPayoutsForAdmin } from "@/server/loaders/payment";

import AdminUserPayoutModal from "../AdminUserPayoutModal/AdminUserPayoutModal";

export type Prize = Awaited<ReturnType<typeof getUserPayoutsForAdmin>>[number];

export const prizeColumns: ColumnDef<Prize>[] = [
  {
    accessorKey: "UserName",
    cell: ({ row }) => {
      return (
        <>
          <div className="font-bold">{row.original.UserName}</div>
          <div className="text-muted font-bold">{row.original.UserTeamName}</div>
        </>
      );
    },
    header: ({ column }) => <SortableColumnHeader column={column} title="Name" />,
  },
  {
    accessorKey: "UserWon",
    cell: ({ row }) => {
      return (
        <div
          className={cn(
            "text-right font-bold",
            Number(row.original.UserBalance) === Number(row.original.UserWon)
              ? "text-red-600"
              : Number(row.original.UserBalance) === 0
                ? "text-green-600 line-through"
                : "text-amber-600",
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
          <div className="text-muted">{row.original.UserPaymentAccount}</div>
        </>
      );
    },
    header: ({ column }) => <SortableColumnHeader column={column} title="Account" />,
  },
  {
    accessorKey: "UserBalance",
    cell: ({ row }) => {
      const [modalOpen, setModalOpen] = useState<null | typeof row.original>(null);

      const addUserPayout = async (userID: number, amount: number): Promise<void> => {
        const toastId = toast.loading("Saving...", {
          closeButton: false,
          dismissible: false,
          duration: Infinity,
        });
        const result = await insertUserPayout({ amount, userID });

        processFormState(
          result,
          () => {
            setModalOpen(null);
          },
          "Successfully updated user payout amount!",
        );
        toast.dismiss(toastId);
      };

      return (
        <>
          <FaDollarSign
            className={cn(
              "cursor-pointer size-8",
              Number(row.original.UserBalance) === Number(row.original.UserWon)
                ? "text-red-600"
                : Number(row.original.UserBalance) === 0
                  ? "text-green-600"
                  : "text-amber-600",
            )}
            onClick={() => setModalOpen(row.original)}
          />

          <AdminUserPayoutModal
            handleClose={() => setModalOpen(null)}
            show={modalOpen !== null}
            updateAmount={addUserPayout}
            winner={modalOpen}
          />
        </>
      );
    },
    header: "Mark Paid",
  },
];
