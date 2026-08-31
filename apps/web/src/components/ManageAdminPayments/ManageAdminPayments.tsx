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

import { WEEKS_IN_SEASON } from "@nfl-pool-monorepo/utils/constants";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import "client-only";

import { arktypeResolver } from "@hookform/resolvers/arktype";
import { Table, TableBody, TableCell, TableRow } from "@nfl-pool-monorepo/ui/components/table";
import { useAction } from "next-safe-action/hooks";
import { type FC, useRef } from "react";
import { type SubmitHandler, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { onActionError } from "@/lib/actionErrorToast";
import { toArktypeResolver } from "@/lib/form-errors";
import { payoutsSchema } from "@/lib/validation";
import { updatePayouts } from "@/server/actions/systemValue";

import { PrizeInputsForm } from "./PrizeInputsForm";

type CalculatedRowProps = {
  isBold?: boolean;
  isIndented?: boolean;
  label: string;
} & ({ count: number; mode: "count"; money: null | number } | { mode: "total"; total: null | number });

const CalculatedRow: FC<CalculatedRowProps> = (props) => {
  const { label, isBold = false, isIndented = false } = props;
  const isCountMode = props.mode === "count";

  return (
    <TableRow className={cn("border-b-0", isBold && "font-bold")}>
      <TableCell className={cn("relative overflow-hidden min-w-8 h-[41px]")} colSpan={isCountMode ? 1 : 2}>
        <div
          className={cn(
            'absolute ps-1 after:content-["...................................................................................................."]',
            isIndented && "ms-3",
          )}
        >
          {label}
        </div>
      </TableCell>
      {isCountMode && (
        <TableCell className="relative overflow-hidden">
          <div
            className={cn(
              'absolute ps-1 after:content-["...................................................................................................."]',
            )}
          >
            ${props.money} x {props.count}
          </div>
        </TableCell>
      )}
      <TableCell className={cn("relative text-end w-[60px]")}>
        <div className="absolute">{isCountMode ? `$${props.count * (props.money ?? 0)}` : `$${props.total}`}</div>
      </TableCell>
    </TableRow>
  );
};

type Props = {
  overallPrizes: [number, number, number, number];
  poolCost: number;
  registeredCount: number;
  survivorCost: number;
  survivorCount: number;
  survivorPrizes: [number, number, number];
  weeklyPrizes: [number, number, number];
};

const ManageAdminPayments: FC<Props> = ({
  overallPrizes,
  poolCost,
  registeredCount,
  survivorCost,
  survivorCount,
  survivorPrizes,
  weeklyPrizes,
}) => {
  const form = useForm<typeof payoutsSchema.infer>({
    defaultValues: {
      overall1stPrize: overallPrizes[1],
      overall2ndPrize: overallPrizes[2],
      overall3rdPrize: overallPrizes[3],
      survivor1stPrize: survivorPrizes[1],
      survivor2ndPrize: survivorPrizes[2],
      weekly1stPrize: weeklyPrizes[1],
      weekly2ndPrize: weeklyPrizes[2],
    },
    resolver: toArktypeResolver(arktypeResolver(payoutsSchema)),
  });

  const overall1stPrize = useWatch({
    control: form.control,
    name: "overall1stPrize",
  });
  const overall2ndPrize = useWatch({
    control: form.control,
    name: "overall2ndPrize",
  });
  const overall3rdPrize = useWatch({
    control: form.control,
    name: "overall3rdPrize",
  });
  const weekly1stPrize = useWatch({
    control: form.control,
    name: "weekly1stPrize",
  });
  const weekly2ndPrize = useWatch({
    control: form.control,
    name: "weekly2ndPrize",
  });
  const survivor1stPrize = useWatch({
    control: form.control,
    name: "survivor1stPrize",
  });
  const survivor2ndPrize = useWatch({
    control: form.control,
    name: "survivor2ndPrize",
  });

  const poolRemaining =
    poolCost * registeredCount -
    (weekly1stPrize ?? 0) * WEEKS_IN_SEASON -
    (weekly2ndPrize ?? 0) * WEEKS_IN_SEASON -
    (overall1stPrize ?? 0) -
    (overall2ndPrize ?? 0) -
    (overall3rdPrize ?? 0) -
    (poolCost ?? 0);
  const survivorRemaining =
    (survivorCost ?? 0) * (survivorCount ?? 0) - (survivor1stPrize ?? 0) - (survivor2ndPrize ?? 0);
  const hasBeenSaved = weeklyPrizes.reduce((acc, prize) => acc + prize) > 0;
  const toastIdRef = useRef<string | number | undefined>(undefined);

  const { execute, isPending } = useAction(updatePayouts, {
    onError: onActionError,
    onSettled: () => {
      if (toastIdRef.current) toast.dismiss(toastIdRef.current);
    },
    onSuccess: () => {
      toast.success("Successfully set payouts!");
    },
  });

  const onSubmit: SubmitHandler<typeof payoutsSchema.infer> = (data) => {
    toastIdRef.current = toast.loading("Setting payouts...", {
      closeButton: false,
      dismissible: false,
      duration: Infinity,
    });
    execute(data);
  };

  return (
    <div className="flex flex-col">
      <div className="w-full bg-muted/80 p-4 border border-secondary rounded-md">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-center">Prizes</h1>
        <div className="flex">
          <div className="w-full md:w-2/3">
            <PrizeInputsForm
              form={form}
              hasBeenSaved={hasBeenSaved}
              isPending={isPending}
              onSubmit={onSubmit}
              poolCost={poolCost}
              survivorCost={survivorCost}
            />
          </div>

          <div className="w-full md:w-1/3">
            <Table className="align-middle text-nowrap">
              <TableBody>
                <CalculatedRow count={registeredCount} label="Pool Total" mode="count" money={poolCost} />
                <CalculatedRow
                  count={WEEKS_IN_SEASON}
                  isIndented
                  label="Weekly 1st place"
                  mode="count"
                  money={weekly1stPrize ?? null}
                />
                <CalculatedRow
                  count={WEEKS_IN_SEASON}
                  isIndented
                  label="Weekly 2nd place"
                  mode="count"
                  money={weekly2ndPrize ?? null}
                />
                <CalculatedRow isIndented label="Overall 1st place" mode="total" total={overall1stPrize ?? null} />
                <CalculatedRow isIndented label="Overall 2nd place" mode="total" total={overall2ndPrize ?? null} />
                <CalculatedRow isIndented label="Overall 3rd place" mode="total" total={overall3rdPrize ?? null} />
                <CalculatedRow isIndented label="Overall last place" mode="total" total={poolCost} />
                <CalculatedRow isBold isIndented label="Leftover" mode="total" total={poolRemaining} />
                <CalculatedRow count={survivorCount} label="Survivor Total" mode="count" money={survivorCost} />
                <CalculatedRow isIndented label="Survivor 1st place" mode="total" total={survivor1stPrize ?? null} />
                <CalculatedRow isIndented label="Survivor 2nd place" mode="total" total={survivor2ndPrize ?? null} />
                <CalculatedRow isBold isIndented label="Leftover" mode="total" total={survivorRemaining} />
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageAdminPayments;
