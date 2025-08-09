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
import { type FC, useEffect, useState } from "react";
import { PiFootballDuotone } from "react-icons/pi";

import type { getUserPayoutsForAdmin } from "@/server/loaders/payment";

type Props = {
  handleClose: () => void;
  show?: boolean;
  updateAmount: (userID: number, amount: number) => Promise<void>;
  winner: null | Awaited<ReturnType<typeof getUserPayoutsForAdmin>>[number];
};

const AdminUserPayoutModal: FC<Props> = ({ handleClose, show = false, updateAmount, winner }) => {
  const fullName = winner?.UserName ?? "Missing Name";
  const remainingToPay = Number(winner?.UserWon ?? 0) + Number(winner?.UserPaidOut ?? 0);
  const [toPay, setToPay] = useState<number>(remainingToPay);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setToPay(remainingToPay);
  }, [remainingToPay]);

  const handleSave = async (): Promise<void> => {
    if (!winner) {
      return;
    }

    setLoading(true);
    await updateAmount(winner.UserID, toPay ?? 0);
    setLoading(false);
  };

  return (
    <Dialog onOpenChange={handleClose} open={show}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How much have they been paid?</DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <div className="mb-3">
          <Label htmlFor="UserPayoutAmount">
            {remainingToPay > 0
              ? `${fullName} is still owed $${remainingToPay} / $${Number(winner?.UserWon ?? 0)}`
              : `${fullName} has been paid $${Number(winner?.UserWon ?? 0)}`}
          </Label>
          <Input
            className="dark:bg-white"
            id="UserPayoutAmount"
            max={remainingToPay}
            onChange={(event) => {
              let value = +event.target.value;

              if (value < 0) value = 0;

              if (value > (winner?.UserWon ?? 0)) {
                value = winner?.UserWon ?? 0;
              }

              setToPay(value);
            }}
            placeholder="To pay amount in $"
            type="number"
            value={remainingToPay}
          />
          {/* biome-ignore lint/a11y/noStaticElementInteractions: This is a div with a click handler, but it's not a button */}
          <abbr
            className="text-muted"
            onClick={() => {
              winner?.UserPaymentAccount && navigator.clipboard.writeText(winner.UserPaymentAccount);
            }}
            onKeyDown={() => {
              winner?.UserPaymentAccount && navigator.clipboard.writeText(winner.UserPaymentAccount);
            }}
            title="Click to copy payment account"
          >
            {winner?.UserPaymentType}: {winner?.UserPaymentAccount}
          </abbr>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button disabled={loading} type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button disabled={loading} onClick={handleSave} type="button" variant="primary">
            {loading ? (
              <>
                <PiFootballDuotone aria-hidden="true" className="animate-spin hidden md:inline-block" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminUserPayoutModal;
