import { Button } from "@nfl-pool-monorepo/ui/components/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@nfl-pool-monorepo/ui/components/form";
import { Input } from "@nfl-pool-monorepo/ui/components/input";
import { Label } from "@nfl-pool-monorepo/ui/components/label";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { FC } from "react";
import type { ControllerFieldState, ControllerRenderProps, UseFormReturn } from "react-hook-form";

import { processFormErrors } from "@/lib/form-errors";
import type { payoutsSchema } from "@/lib/validation";

type PrizeInputsFormProps = {
  form: UseFormReturn<typeof payoutsSchema.infer>;
  hasBeenSaved: boolean;
  isPending: boolean;
  onSubmit: (data: typeof payoutsSchema.infer) => void;
  poolCost: number;
  survivorCost: number;
};

type PrizeFieldRenderProps<TName extends keyof typeof payoutsSchema.infer> = {
  field: ControllerRenderProps<typeof payoutsSchema.infer, TName>;
  fieldState: ControllerFieldState;
};

export const PrizeInputsForm: FC<PrizeInputsFormProps> = ({
  form,
  hasBeenSaved,
  isPending,
  onSubmit,
  poolCost,
  survivorCost,
}) => {
  const renderWeekly1stPrizeField = ({ field, fieldState }: PrizeFieldRenderProps<"weekly1stPrize">) => (
    <FormItem>
      <FormLabel className="required">Weekly 1st place</FormLabel>
      <FormControl>
        <Input {...field} className={cn("dark:bg-white", fieldState.error && "border-red-600")} type="number" />
      </FormControl>
      <FormMessage />
    </FormItem>
  );

  const renderWeekly2ndPrizeField = ({ field, fieldState }: PrizeFieldRenderProps<"weekly2ndPrize">) => (
    <FormItem>
      <FormLabel className="required">Weekly 2nd place</FormLabel>
      <FormControl>
        <Input {...field} className={cn("dark:bg-white", fieldState.error && "border-red-600")} type="number" />
      </FormControl>
      <FormMessage />
    </FormItem>
  );

  const renderOverall1stPrizeField = ({ field, fieldState }: PrizeFieldRenderProps<"overall1stPrize">) => (
    <FormItem>
      <FormLabel className="required">Overall 1st place</FormLabel>
      <FormControl>
        <Input {...field} className={cn("dark:bg-white", fieldState.error && "border-red-600")} type="number" />
      </FormControl>
      <FormMessage />
    </FormItem>
  );

  const renderOverall2ndPrizeField = ({ field, fieldState }: PrizeFieldRenderProps<"overall2ndPrize">) => (
    <FormItem>
      <FormLabel className="required h-5">Overall 2nd place</FormLabel>
      <FormControl>
        <Input {...field} className={cn("dark:bg-white", fieldState.error && "border-red-600")} type="number" />
      </FormControl>
      <FormMessage />
    </FormItem>
  );

  const renderOverall3rdPrizeField = ({ field, fieldState }: PrizeFieldRenderProps<"overall3rdPrize">) => (
    <FormItem>
      <FormLabel className="required h-5">Overall 3rd place</FormLabel>
      <FormControl>
        <Input {...field} className={cn("dark:bg-white", fieldState.error && "border-red-600")} type="number" />
      </FormControl>
      <FormMessage />
    </FormItem>
  );

  const renderSurvivor1stPrizeField = ({ field, fieldState }: PrizeFieldRenderProps<"survivor1stPrize">) => (
    <FormItem>
      <FormLabel className="required h-5">Survivor 1st place</FormLabel>
      <FormControl>
        <Input {...field} className={cn("dark:bg-white", fieldState.error && "border-red-600")} type="number" />
      </FormControl>
      <FormMessage />
    </FormItem>
  );

  const renderSurvivor2ndPrizeField = ({ field, fieldState }: PrizeFieldRenderProps<"survivor2ndPrize">) => (
    <FormItem>
      <FormLabel className="required h-5">Survivor 2nd place</FormLabel>
      <FormControl>
        <Input {...field} className={cn("dark:bg-white", fieldState.error && "border-red-600")} type="number" />
      </FormControl>
      <FormMessage />
    </FormItem>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, processFormErrors)}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="poolCost">Pool Cost</Label>
            <Input
              className={cn("dark:bg-transparent border-0 shadow-none")}
              id="poolCost"
              readOnly
              type="number"
              value={poolCost}
            />
          </div>

          <FormField control={form.control} name="weekly1stPrize" render={renderWeekly1stPrizeField} />

          <FormField control={form.control} name="weekly2ndPrize" render={renderWeekly2ndPrizeField} />

          <div />

          <FormField control={form.control} name="overall1stPrize" render={renderOverall1stPrizeField} />

          <FormField control={form.control} name="overall2ndPrize" render={renderOverall2ndPrizeField} />

          <FormField control={form.control} name="overall3rdPrize" render={renderOverall3rdPrizeField} />

          <div className="grid gap-2">
            <Label htmlFor="overallLastPlace">Overall last place</Label>
            <Input
              className={cn("dark:bg-transparent border-0 shadow-none")}
              id="overallLastPlace"
              readOnly
              type="number"
              value={poolCost}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="survivorCost">Survivor cost</Label>
            <Input
              className={cn("dark:bg-transparent border-0 shadow-none")}
              id="survivorCost"
              readOnly
              type="number"
              value={survivorCost}
            />
          </div>

          <FormField control={form.control} name="survivor1stPrize" render={renderSurvivor1stPrizeField} />

          <FormField control={form.control} name="survivor2ndPrize" render={renderSurvivor2ndPrizeField} />

          <div />

          <Button className="col-span-full" disabled={hasBeenSaved || isPending} type="submit" variant="primary">
            {hasBeenSaved ? "Saved" : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
