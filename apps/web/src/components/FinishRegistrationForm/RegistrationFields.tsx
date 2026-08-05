import type { Status } from "@nfl-pool-monorepo/types";
import { Button } from "@nfl-pool-monorepo/ui/components/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@nfl-pool-monorepo/ui/components/form";
import { Input } from "@nfl-pool-monorepo/ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@nfl-pool-monorepo/ui/components/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@nfl-pool-monorepo/ui/components/select";
import { Tabs, TabsList, TabsTrigger } from "@nfl-pool-monorepo/ui/components/tabs";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import { type FC, useCallback } from "react";
import type { Control, ControllerFieldState, ControllerRenderProps } from "react-hook-form";
import { PiFootballDuotone, PiQuestionDuotone } from "react-icons/pi";

import { PaymentMethod } from "@/lib/constants";
import type { finishRegistrationSchema } from "@/lib/validation";

import GoogleAuthButton from "../GoogleAuthButton/GoogleAuthButton";
import { ProgressBarLink } from "../ProgressBar/ProgressBar";

type FinishRegistrationFormValues = typeof finishRegistrationSchema.infer;

type RegistrationFieldsProps = {
  control: Control<FinishRegistrationFormValues>;
  errorCount: number;
  hasGoogle: boolean;
  isPending: boolean;
  isUntrusted: boolean;
  seasonStatus: Status;
};

const createSurvivorChangeHandler = (onChange: (...event: unknown[]) => void) => (value: string) =>
  onChange(value === "Yes");

export const RegistrationFields: FC<RegistrationFieldsProps> = ({
  control,
  errorCount,
  hasGoogle,
  isPending,
  isUntrusted,
  seasonStatus,
}) => {
  const renderEmailField = useCallback(
    ({ field }: { field: ControllerRenderProps<FinishRegistrationFormValues, "UserEmail"> }) => (
      <FormItem className="md:col-span-2">
        <FormLabel className="required h-5">Email</FormLabel>
        <FormControl>
          <Input
            {...field}
            autoComplete="email"
            className="border-0 shadow-none dark:bg-transparent"
            id="UserEmail"
            placeholder="Email"
            readOnly
            type="email"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    ),
    [],
  );

  const renderFirstNameField = useCallback(
    ({
      field,
      fieldState,
    }: {
      field: ControllerRenderProps<FinishRegistrationFormValues, "UserFirstName">;
      fieldState: ControllerFieldState;
    }) => (
      <FormItem>
        <FormLabel className="required h-5">First Name</FormLabel>
        <FormControl>
          <Input
            {...field}
            autoComplete="given-name"
            className={cn("dark:bg-white", fieldState.error && "border-red-600")}
            id="UserFirstName"
            placeholder="First name"
            type="text"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    ),
    [],
  );

  const renderLastNameField = useCallback(
    ({
      field,
      fieldState,
    }: {
      field: ControllerRenderProps<FinishRegistrationFormValues, "UserLastName">;
      fieldState: ControllerFieldState;
    }) => (
      <FormItem>
        <FormLabel className="required h-5">Last Name</FormLabel>
        <FormControl>
          <Input
            {...field}
            autoComplete="family-name"
            className={cn("dark:bg-white", fieldState.error && "border-red-600")}
            id="UserLastName"
            placeholder="Last name"
            type="text"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    ),
    [],
  );

  const renderTeamNameField = useCallback(
    ({
      field,
      fieldState,
    }: {
      field: ControllerRenderProps<FinishRegistrationFormValues, "UserTeamName">;
      fieldState: ControllerFieldState;
    }) => (
      <FormItem>
        <FormLabel className="h-5">
          Team Name <span className="text-xs text-muted-foreground">(Optional)</span>
        </FormLabel>
        <FormControl>
          <Input
            {...field}
            autoComplete="off"
            className={cn("dark:bg-white", fieldState.error && "border-red-600")}
            id="UserTeamName"
            placeholder="Team name"
            type="text"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    ),
    [],
  );

  const renderReferredByField = useCallback(
    ({
      field,
      fieldState,
    }: {
      field: ControllerRenderProps<FinishRegistrationFormValues, "UserReferredByRaw">;
      fieldState: ControllerFieldState;
    }) => (
      <FormItem>
        <FormLabel className="required h-5">Who referred you to play?</FormLabel>
        <FormControl>
          <Input
            {...field}
            autoComplete="off"
            className={cn("dark:bg-white", fieldState.error && "border-red-600")}
            id="UserReferredByRaw"
            placeholder="Enter their full name for immediate access"
            type="text"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    ),
    [],
  );

  const renderPlaysSurvivorField = useCallback(
    ({ field }: { field: ControllerRenderProps<FinishRegistrationFormValues, "UserPlaysSurvivor"> }) => (
      <FormItem>
        <FormLabel className="required h-5">
          Add on survivor game?&nbsp;
          <Popover>
            <PopoverTrigger aria-label="More information about the survivor game" type="button">
              <PiQuestionDuotone className="size-5" />
            </PopoverTrigger>
            <PopoverContent className="max-w-[300px]">
              You can choose to join or leave the survivor pool up until the start of the first game of the season. For
              more questions, see the{" "}
              <ProgressBarLink className="underline" href="/support#survivorpool">
                survivor pool FAQ
              </ProgressBarLink>
            </PopoverContent>
          </Popover>
        </FormLabel>
        <FormControl>
          <Tabs onValueChange={createSurvivorChangeHandler(field.onChange)} value={field.value ? "Yes" : "No"}>
            <TabsList>
              <TabsTrigger value="No">No</TabsTrigger>
              <TabsTrigger value="Yes">Yes</TabsTrigger>
            </TabsList>
          </Tabs>
        </FormControl>
        <FormMessage />
      </FormItem>
    ),
    [],
  );

  const renderPaymentTypeField = useCallback(
    ({
      field,
      fieldState,
    }: {
      field: ControllerRenderProps<FinishRegistrationFormValues, "UserPaymentType">;
      fieldState: ControllerFieldState;
    }) => (
      <FormItem>
        <FormLabel className="required h-5">Payment Type</FormLabel>
        <Select onValueChange={field.onChange} value={field.value}>
          <FormControl>
            <SelectTrigger
              aria-label="Payment Type"
              className={cn("dark:bg-white w-full", fieldState.error && "border-red-600")}
            >
              <SelectValue placeholder="-- Select a payment type --">{field.value}</SelectValue>
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {PaymentMethod.map((paymentMethod) => (
              <SelectItem key={paymentMethod} value={paymentMethod}>
                {paymentMethod}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    ),
    [],
  );

  const renderPaymentAccountField = useCallback(
    ({
      field,
      fieldState,
    }: {
      field: ControllerRenderProps<FinishRegistrationFormValues, "UserPaymentAccount">;
      fieldState: ControllerFieldState;
    }) => (
      <FormItem>
        <FormLabel className="required h-5">
          Payment Account&nbsp;
          <Popover>
            <PopoverTrigger aria-label="More information about payment account" type="button">
              <PiQuestionDuotone className="size-5" />
            </PopoverTrigger>
            <PopoverContent className="max-w-[300px]">
              If you want to receive any prize money, you need to enter your exact payment account information here
              (i.e. email, username or phone number for your account).{" "}
              <strong>This is your responsibility as we will not be chasing people down to pay them.</strong> If
              entering phone number, please enter a valid phone number in the format +1 999 999 9999.
            </PopoverContent>
          </Popover>
        </FormLabel>
        <FormControl>
          <Input
            {...field}
            autoComplete="off"
            className={cn("dark:bg-white", fieldState.error && "border-red-600")}
            id="UserPaymentAccount"
            placeholder="Payment account"
            type="text"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    ),
    [],
  );

  return (
    <>
      <FormField control={control} name="UserEmail" render={renderEmailField} />

      <FormField control={control} name="UserFirstName" render={renderFirstNameField} />

      <FormField control={control} name="UserLastName" render={renderLastNameField} />

      <FormField control={control} name="UserTeamName" render={renderTeamNameField} />

      {!!isUntrusted && <FormField control={control} name="UserReferredByRaw" render={renderReferredByField} />}

      {seasonStatus === "Not Started" && (
        <FormField control={control} name="UserPlaysSurvivor" render={renderPlaysSurvivorField} />
      )}

      <FormField control={control} name="UserPaymentType" render={renderPaymentTypeField} />

      <FormField control={control} name="UserPaymentAccount" render={renderPaymentAccountField} />

      <div className="mt-6">
        <GoogleAuthButton isLinked={hasGoogle} />
      </div>
      <div className="grid md:col-span-2 text-center">
        <Button disabled={isPending} type="submit" variant="primary">
          {isPending ? (
            <>
              <PiFootballDuotone className="animate-spin" />
              Submitting...
            </>
          ) : (
            "Register"
          )}
        </Button>
        {errorCount > 0 && (
          <div className="text-destructive text-sm" role="alert">
            Please fix {errorCount} {errorCount === 1 ? "error" : "errors"} above
          </div>
        )}
      </div>
    </>
  );
};
