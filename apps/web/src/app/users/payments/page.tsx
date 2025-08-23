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

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@nfl-pool-monorepo/ui/components/table";
import { redirect } from "next/navigation";
import type { FC } from "react";
import "server-only";

import CustomHead from "@/components/CustomHead/CustomHead";
import PaymentSelector from "@/components/PaymentSelector/PaymentSelector";
import { ProgressBarLink } from "@/components/ProgressBar/ProgressBar";
import TextSeparator from "@/components/TextSeparator/TextSeparator";
import { requireRegistered } from "@/lib/auth";
import { getMyPayments } from "@/server/loaders/payment";
import { getCurrentUser } from "@/server/loaders/user";

const ViewPayments: FC<PageProps<"/users/payments">> = async () => {
  const redirectUrl = await requireRegistered();

  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  const [currentUser, payments] = await Promise.all([getCurrentUser(), getMyPayments()]);
  let owed = 0;

  return (
    <div className="h-full flex flex-col">
      <CustomHead title="View Payments" />
      <div className="bg-gray-100/80 text-black mx-2 pt-5 md:pt-3 min-h-screen pb-4 flex-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start text-black" scope="col">
                Description
              </TableHead>
              <TableHead className="text-center text-black" scope="col">
                Week
              </TableHead>
              <TableHead className="text-end text-black" scope="col">
                Amount
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => {
              const amount = Number(payment.PaymentAmount);
              owed += amount;

              return (
                <TableRow className={amount < 0 ? "bg-red-300" : "bg-green-300"} key={`payment-${payment.PaymentID}`}>
                  <TableCell className="text-start">{payment.PaymentDescription}</TableCell>
                  <TableCell className="text-center">{payment.PaymentWeek}</TableCell>
                  <TableCell className="text-end">${Math.abs(amount)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow className="font-semibold bg-gray-100">
              <TableCell className="text-start" colSpan={2}>
                {owed < 0 ? "Total you owe:" : "Total you are owed:"}
              </TableCell>
              <TableCell className="text-end">${Math.abs(owed)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
        {owed < 0 && (
          <PaymentSelector amount={Math.abs(owed)} defaultPayment={currentUser.UserPaymentType ?? "Paypal"} />
        )}
        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight text-center text-red-500">
          '*** All prizes are paid at the end of the year ***'
        </h3>
        <TextSeparator>My Prize Payment Info</TextSeparator>
        <div className="mx-3">Payment Type: {currentUser.UserPaymentType}</div>
        <div className="mx-3">Payment Account: {currentUser.UserPaymentAccount}</div>
        <div className="mx-3">
          <ProgressBarLink className="underline" href="/users/edit">
            Change the account to be paid out
          </ProgressBarLink>
        </div>
      </div>
    </div>
  );
};

export default ViewPayments;
