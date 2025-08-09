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

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@nfl-pool-monorepo/ui/components/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@nfl-pool-monorepo/ui/components/form";
import { Input } from "@nfl-pool-monorepo/ui/components/input";
import { Table, TableBody, TableCell, TableRow } from "@nfl-pool-monorepo/ui/components/table";
import type { FC } from "react";
import { type SubmitHandler, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { payoutsSchema } from "@/lib/zod";
import { processFormErrors, processFormState } from "@/lib/zsa";
import { updatePayouts } from "@/server/actions/systemValue";

type CalculatedRowProps = {
  count?: null | number;
  label: string;
  isBold?: boolean;
  isIndented?: boolean;
  money?: null | number;
  total?: null | number;
};

const CalculatedRow: FC<CalculatedRowProps> = ({ count, label, isBold = false, isIndented = false, money, total }) => {
  const hasMiddleCol = total === undefined;

  return (
    <TableRow className={cn("border-b-0", isBold && "font-bold")}>
      <TableCell className={cn("relative overflow-hidden min-w-8 h-[41px]")} colSpan={hasMiddleCol ? 1 : 2}>
        <div
          className={cn(
            'absolute ps-1 after:content-["...................................................................................................."]',
            isIndented && "ms-3",
          )}
        >
          {label}
        </div>
      </TableCell>
      {hasMiddleCol && (
        <TableCell className="relative overflow-hidden">
          <div
            className={cn(
              'absolute ps-1 after:content-["...................................................................................................."]',
            )}
          >
            ${money} x {count}
          </div>
        </TableCell>
      )}
      <TableCell className={cn("relative text-end w-[60px]")}>
        <div className="absolute">{hasMiddleCol ? `$${(count ?? 0) * (money ?? 0)}` : `$${total}`}</div>
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

/**
 * This component is used to manage the payouts for the pool.
 *
 * @param {number} overallPrizes - The prizes for the overall pool.
 * @param {number} poolCost - The cost of the pool.
 * @param {number} registeredCount - The number of people registered for the pool.
 * @param {number} survivorCost - The cost of the survivor pool.
 * @param {number} survivorCount - The number of people registered for the survivor pool.
 * @param {number} survivorPrizes - The prizes for the survivor pool.
 * @param {number} weeklyPrizes - The prizes for the weekly pool.
 * @returns {JSX.Element} The component to render for managing the payouts.
 */
const ManageAdminPayments: FC<Props> = ({
  overallPrizes,
  poolCost,
  registeredCount,
  survivorCost,
  survivorCount,
  survivorPrizes,
  weeklyPrizes,
}) => {
  const form = useForm<z.infer<typeof payoutsSchema>>({
    defaultValues: {
      overall1stPrize: overallPrizes[1],
      overall2ndPrize: overallPrizes[2],
      overall3rdPrize: overallPrizes[3],
      survivor1stPrize: survivorPrizes[1],
      survivor2ndPrize: survivorPrizes[2],
      weekly1stPrize: weeklyPrizes[1],
      weekly2ndPrize: weeklyPrizes[2],
    },
    resolver: zodResolver(payoutsSchema),
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

  const onSubmit: SubmitHandler<z.infer<typeof payoutsSchema>> = async (data) => {
    const toastId = toast.loading("Setting payouts...", {
      closeButton: false,
      dismissible: false,
      duration: Infinity,
    });
    const result = await updatePayouts(data);

    processFormState(
      result,
      () => {
        /* NOOP */
      },
      "Successfully set payouts!",
    );
    toast.dismiss(toastId);
  };

  return (
    <div className="flex flex-col">
      <div className="w-full bg-gray-100/80 p-4 border border-secondary rounded-md">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-center">Prizes</h1>
        <div className="flex">
          <div className="w-full md:w-2/3">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit, processFormErrors)}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormItem>
                    <FormLabel>Pool Cost</FormLabel>
                    <FormControl>
                      <Input
                        className={cn("dark:bg-transparent border-0 shadow-none")}
                        readOnly
                        type="number"
                        value={poolCost}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>

                  <FormField
                    control={form.control}
                    name="weekly1stPrize"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="required">Weekly 1st place</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            aria-invalid={!!fieldState.error}
                            className={cn("dark:bg-white", fieldState.error && "border-red-600")}
                            type="number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weekly2ndPrize"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="required">Weekly 2nd place</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            aria-invalid={!!fieldState.error}
                            className={cn("dark:bg-white", fieldState.error && "border-red-600")}
                            type="number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div />

                  <FormField
                    control={form.control}
                    name="overall1stPrize"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="required">Overall 1st place</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            aria-invalid={!!fieldState.error}
                            className={cn("dark:bg-white", fieldState.error && "border-red-600")}
                            type="number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="overall2ndPrize"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="required h-5">Overall 2nd place</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            aria-invalid={!!fieldState.error}
                            className={cn("dark:bg-white", fieldState.error && "border-red-600")}
                            type="number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="overall3rdPrize"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="required h-5">Overall 3rd place</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            aria-invalid={!!fieldState.error}
                            className={cn("dark:bg-white", fieldState.error && "border-red-600")}
                            type="number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormItem>
                    <FormLabel>Overall last place</FormLabel>
                    <FormControl>
                      <Input
                        className={cn("dark:bg-transparent border-0 shadow-none")}
                        readOnly
                        type="number"
                        value={poolCost}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>

                  <FormItem>
                    <FormLabel>Survivor cost</FormLabel>
                    <FormControl>
                      <Input
                        className={cn("dark:bg-transparent border-0 shadow-none")}
                        readOnly
                        type="number"
                        value={survivorCost}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>

                  <FormField
                    control={form.control}
                    name="survivor1stPrize"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="required h-5">Survivor 1st place</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            aria-invalid={!!fieldState.error}
                            className={cn("dark:bg-white", fieldState.error && "border-red-600")}
                            type="number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="survivor2ndPrize"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="required h-5">Survivor 2nd place</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            aria-invalid={!!fieldState.error}
                            className={cn("dark:bg-white", fieldState.error && "border-red-600")}
                            type="number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div />

                  <Button className="col-span-full" disabled={hasBeenSaved} type="submit" variant="primary">
                    {hasBeenSaved ? "Saved" : "Save"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          <div className="w-full md:w-1/3">
            <Table className="align-middle text-nowrap">
              <TableBody>
                <CalculatedRow count={registeredCount} label="Pool Total" money={poolCost} />
                <CalculatedRow
                  count={WEEKS_IN_SEASON}
                  isIndented
                  label="Weekly 1st place"
                  money={weekly1stPrize ?? null}
                />
                <CalculatedRow
                  count={WEEKS_IN_SEASON}
                  isIndented
                  label="Weekly 2nd place"
                  money={weekly2ndPrize ?? null}
                />
                <CalculatedRow isIndented label="Overall 1st place" total={overall1stPrize ?? null} />
                <CalculatedRow isIndented label="Overall 2nd place" total={overall2ndPrize ?? null} />
                <CalculatedRow isIndented label="Overall 3rd place" total={overall3rdPrize ?? null} />
                <CalculatedRow isIndented label="Overall last place" total={poolCost} />
                <CalculatedRow isBold isIndented label="Leftover" total={poolRemaining} />
                <CalculatedRow count={survivorCount} label="Survivor Total" money={survivorCost} />
                <CalculatedRow isIndented label="Survivor 1st place" total={survivor1stPrize ?? null} />
                <CalculatedRow isIndented label="Survivor 2nd place" total={survivor2ndPrize ?? null} />
                <CalculatedRow isBold isIndented label="Leftover" total={survivorRemaining} />
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageAdminPayments;
