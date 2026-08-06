"use client";

import { Button } from "@nfl-pool-monorepo/ui/components/button";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import { useAction } from "next-safe-action/hooks";
import { type FC, useRef, useState } from "react";
import { FaDollarSign } from "react-icons/fa";
import { toast } from "sonner";

import { insertUserPayout } from "@/server/actions/payment";

import AdminUserPayoutModal from "../AdminUserPayoutModal/AdminUserPayoutModal";
import type { Prize } from "./AdminPayoutColumns";

type BalanceCellProps = {
  prize: Prize;
};

export const BalanceCell: FC<BalanceCellProps> = ({ prize }) => {
  const [modalOpen, setModalOpen] = useState<null | Prize>(null);
  const toastIdRef = useRef<string | number | undefined>(undefined);

  const { execute: executeInsertPayout } = useAction(insertUserPayout, {
    onError: ({ error }) => {
      toast.error("Something went wrong!", {
        description: error.serverError ?? "Please check the information you are submitting.",
      });
    },
    onSettled: () => {
      if (toastIdRef.current) toast.dismiss(toastIdRef.current);
    },
    onSuccess: () => {
      toast.success("Successfully updated user payout amount!");
      setModalOpen(null);
    },
  });

  const addUserPayout = async (userID: number, amount: number): Promise<void> => {
    toastIdRef.current = toast.loading("Saving...", {
      closeButton: false,
      dismissible: false,
      duration: Infinity,
    });
    executeInsertPayout({ amount, userID });
  };

  const handleOpenModal = () => setModalOpen(prize);

  const handleCloseModal = () => setModalOpen(null);

  return (
    <>
      <Button aria-label={`Mark payout for ${prize.UserName}`} onClick={handleOpenModal} variant="ghost">
        <FaDollarSign
          className={cn(
            "cursor-pointer size-8",
            Number(prize.UserBalance) === Number(prize.UserWon)
              ? "text-red-600"
              : Number(prize.UserBalance) === 0
                ? "text-green-600"
                : "text-amber-600",
          )}
        />
      </Button>

      <AdminUserPayoutModal
        handleClose={handleCloseModal}
        show={modalOpen !== null}
        updateAmount={addUserPayout}
        winner={modalOpen}
      />
    </>
  );
};
