"use client";

import { Button } from "@nfl-pool-monorepo/ui/components/button";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import { useAction } from "next-safe-action/hooks";
import { type FC, useRef, useState } from "react";
import { FaDollarSign } from "react-icons/fa";
import { toast } from "sonner";

import { onActionError } from "@/lib/actionErrorToast";
import { getPayoutStatus } from "@/lib/payoutStatus";
import { insertUserPayout } from "@/server/actions/payment";

import AdminUserPayoutModal from "../AdminUserPayoutModal/AdminUserPayoutModal";
import type { Prize } from "./AdminPayoutColumns";

type BalanceCellProps = {
  prize: Prize;
};

export const BalanceCell: FC<BalanceCellProps> = ({ prize }) => {
  const [modalOpen, setModalOpen] = useState<null | Prize>(null);
  const toastIdRef = useRef<string | number | undefined>(undefined);

  const { executeAsync: executeInsertPayout } = useAction(insertUserPayout, {
    onError: onActionError,
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
    await executeInsertPayout({ amount, userID });
  };

  const handleOpenModal = () => setModalOpen(prize);

  const handleCloseModal = () => setModalOpen(null);

  const payoutStatus = getPayoutStatus(Number(prize.UserBalance), Number(prize.UserWon));

  return (
    <>
      <Button aria-label={`Mark payout for ${prize.UserName}`} onClick={handleOpenModal} variant="ghost">
        <FaDollarSign
          className={cn(
            "cursor-pointer size-8",
            payoutStatus === "unpaid" && "text-red-600",
            payoutStatus === "paid" && "text-green-600",
            payoutStatus === "partial" && "text-amber-600",
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
