"use client";

/*******************************************************************************
 * NFL Confidence Pool FE - the frontend implementation of an NFL confidence pool.
 * Copyright (C) 2015-present Brian Duffey
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see {http://www.gnu.org/licenses/}.
 * Home: https://asitewithnoname.com/
 */

import { Button } from "@nfl-pool-monorepo/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@nfl-pool-monorepo/ui/components/dialog";
import { Input } from "@nfl-pool-monorepo/ui/components/input";
import { Label } from "@nfl-pool-monorepo/ui/components/label";
import { type ChangeEvent, type FC, useEffect, useRef, useState } from "react";
import { PiFootballDuotone } from "react-icons/pi";

import type { getUserPayoutsForAdmin } from "@/server/loaders/payment";

import { clampPayout, getFullName, getPayoutLabel, getRemainingToPay, getWon } from "./adminUserPayout";

type Props = {
  handleClose: () => void;
  show?: boolean;
  updateAmount: (userID: number, amount: number) => Promise<void>;
  winner: null | Awaited<ReturnType<typeof getUserPayoutsForAdmin>>[number];
};

const usePayoutEdit = (show: boolean, winner: Props["winner"], remainingToPay: number) => {
  const [toPay, setToPay] = useState<number>(remainingToPay);
  const wasShowingRef = useRef(show);

  // Only reset the in-progress edit when the modal transitions from closed to open, not on every
  // remainingToPay change - otherwise a background data refresh while the modal is open would
  // silently clobber whatever the admin is currently typing.
  // react-doctor-disable-next-line react-doctor/no-derived-state-effect -- intentional reset on the closed-to-open transition only
  useEffect(() => {
    if (show && !wasShowingRef.current) {
      // react-doctor-disable-next-line react-doctor/no-derived-state -- intentional reset on the closed-to-open transition only
      setToPay(remainingToPay);
    }

    wasShowingRef.current = show;
  }, [show, remainingToPay]);

  const handleToPayChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setToPay(clampPayout(+event.target.value, getWon(winner)));
  };

  return { handleToPayChange, toPay };
};

const usePayoutSave = (winner: Props["winner"], toPay: number, updateAmount: Props["updateAmount"]) => {
  const [loading, setLoading] = useState<boolean>(false);

  const handleSave = async (): Promise<void> => {
    if (!winner) {
      return;
    }

    setLoading(true);

    try {
      await updateAmount(winner.UserID, toPay);
    } catch (error) {
      setLoading(false);
      throw error;
    }

    setLoading(false);
  };

  return { handleSave, loading };
};

const SaveButtonContent: FC<{ loading: boolean }> = ({ loading }) =>
  loading ? (
    <>
      <PiFootballDuotone aria-hidden="true" className="animate-spin hidden md:inline-block" />
      Saving...
    </>
  ) : (
    "Save"
  );

const AdminUserPayoutModal: FC<Props> = ({ handleClose, show = false, updateAmount, winner }) => {
  const fullName = getFullName(winner);
  const remainingToPay = getRemainingToPay(winner);
  const { handleToPayChange, toPay } = usePayoutEdit(show, winner, remainingToPay);
  const { handleSave, loading } = usePayoutSave(winner, toPay, updateAmount);

  const handleCopyPaymentAccount = (): void => {
    if (winner?.UserPaymentAccount) {
      navigator.clipboard.writeText(winner.UserPaymentAccount);
    }
  };

  return (
    <Dialog onOpenChange={handleClose} open={show}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How much have they been paid?</DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <div className="mb-3">
          <Label htmlFor="UserPayoutAmount">{getPayoutLabel(fullName, remainingToPay, getWon(winner))}</Label>
          <Input
            id="UserPayoutAmount"
            max={remainingToPay}
            onChange={handleToPayChange}
            placeholder="To pay amount in $"
            type="number"
            value={toPay}
          />
          <button
            className="text-muted-foreground underline-offset-2 hover:underline"
            onClick={handleCopyPaymentAccount}
            title="Click to copy payment account"
            type="button"
          >
            <abbr className="text-muted-foreground">
              {winner?.UserPaymentType}: {winner?.UserPaymentAccount}
            </abbr>
          </button>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button disabled={loading} type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button disabled={loading} onClick={handleSave} type="button" variant="primary">
            <SaveButtonContent loading={loading} />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminUserPayoutModal;
