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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@nfl-pool-monorepo/ui/components/select";
import { type FC, useState } from "react";
import { toast } from "sonner";

import { PaymentMethod } from "@/lib/constants";

type PaymentSelectorProps = {
  amount: number;
  defaultPayment: (typeof PaymentMethod)[number];
};

const PAYMENT_MESSAGE =
  "NOTE: Please be sure to use an account tied to your name or put your name in the memo field so we correctly attribute your payment to you";

const VENMO_HANDLE = "@brianduffey";
const ZELLE_EMAIL = "bduff9@gmail.com";

const isPaymentMethod = (value: string): value is (typeof PaymentMethod)[number] =>
  (PaymentMethod as readonly string[]).includes(value);

const CopyButton: FC<{ value: string }> = ({ value }) => {
  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <Button className="ml-2 text-foreground" onClick={handleCopy} size="sm" type="button" variant="outline">
      Copy
    </Button>
  );
};

const PaymentSelector: FC<PaymentSelectorProps> = ({ amount, defaultPayment }) => {
  const [paymentType, setPaymentType] = useState<(typeof PaymentMethod)[number]>(defaultPayment);

  const handlePaymentTypeChange = (value: string) => {
    if (isPaymentMethod(value)) {
      setPaymentType(value);
    }
  };

  return (
    <div className="mt-2 mx-3">
      <div>How would you like to pay your balance?</div>

      <Select onValueChange={handlePaymentTypeChange} value={paymentType}>
        <SelectTrigger aria-label="Payment type" className="w-64">
          <SelectValue placeholder="Select a payment type">{paymentType}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.values(PaymentMethod).map((paymentMethod) => (
            <SelectItem key={paymentMethod} value={paymentMethod}>
              {paymentMethod}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="text-center mt-2">
        {paymentType === "Paypal" && (
          <div className="font-bold text-red-500">
            Please pay ${amount} using PayPal:{" "}
            <a
              className="underline"
              href={`https://www.paypal.me/brianduffey/${amount}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              paypal.me/brianduffey/{amount}
            </a>
          </div>
        )}
        {paymentType === "Venmo" && (
          <div className="font-bold text-red-500">
            Please pay ${amount} using Venmo to account {VENMO_HANDLE}
            <CopyButton value={VENMO_HANDLE} />
            <div>
              <a
                className="underline"
                href={`https://venmo.com/brianduffey?txn=pay&amount=${amount}&note=${encodeURIComponent("NFL Confidence Pool")}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                Open Venmo with ${amount} filled in
              </a>
            </div>
          </div>
        )}
        {paymentType === "Zelle" && (
          <div className="font-bold text-red-500">
            Please pay ${amount} using your bank&apos;s Zelle service to account {ZELLE_EMAIL}
            <CopyButton value={ZELLE_EMAIL} />
          </div>
        )}
        <div className="mt-4 font-extrabold">{PAYMENT_MESSAGE}</div>
      </div>
    </div>
  );
};

export default PaymentSelector;
