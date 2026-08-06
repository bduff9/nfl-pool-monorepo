import type { Status } from "@nfl-pool-monorepo/types";
import { Button } from "@nfl-pool-monorepo/ui/components/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@nfl-pool-monorepo/ui/components/form";
import { Input } from "@nfl-pool-monorepo/ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@nfl-pool-monorepo/ui/components/popover";
import { Tabs, TabsList, TabsTrigger } from "@nfl-pool-monorepo/ui/components/tabs";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { FC } from "react";
import type { Control, ControllerFieldState, ControllerRenderProps } from "react-hook-form";
import { PiFootballDuotone, PiQuestionDuotone } from "react-icons/pi";

import type { finishRegistrationSchema } from "@/lib/validation";

import GoogleAuthButton from "../GoogleAuthButton/GoogleAuthButton";
import { ProfilePaymentTypeField, ProfileTextField } from "../ProfileFormFields/ProfileFormFields";
import { paymentAccountLabel, teamNameLabel } from "../ProfileFormFields/profileFieldLabels";
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
  const renderEmailField = ({
    field,
    fieldState,
  }: {
    field: ControllerRenderProps<FinishRegistrationFormValues, "UserEmail">;
    fieldState: ControllerFieldState;
  }) => (
    <ProfileTextField
      autoComplete="email"
      field={field}
      fieldState={fieldState}
      id="UserEmail"
      label="Email"
      placeholder="Email"
      readOnly
      type="email"
    />
  );

  const renderFirstNameField = ({
    field,
    fieldState,
  }: {
    field: ControllerRenderProps<FinishRegistrationFormValues, "UserFirstName">;
    fieldState: ControllerFieldState;
  }) => (
    <ProfileTextField
      autoComplete="given-name"
      field={field}
      fieldState={fieldState}
      id="UserFirstName"
      label="First Name"
      placeholder="First name"
    />
  );

  const renderLastNameField = ({
    field,
    fieldState,
  }: {
    field: ControllerRenderProps<FinishRegistrationFormValues, "UserLastName">;
    fieldState: ControllerFieldState;
  }) => (
    <ProfileTextField
      autoComplete="family-name"
      field={field}
      fieldState={fieldState}
      id="UserLastName"
      label="Last Name"
      placeholder="Last name"
    />
  );

  const renderTeamNameField = ({
    field,
    fieldState,
  }: {
    field: ControllerRenderProps<FinishRegistrationFormValues, "UserTeamName">;
    fieldState: ControllerFieldState;
  }) => (
    <ProfileTextField
      field={field}
      fieldState={fieldState}
      id="UserTeamName"
      label={teamNameLabel}
      placeholder="Team name"
      required={false}
    />
  );

  const renderReferredByField = ({
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
  );

  const renderPlaysSurvivorField = ({
    field,
  }: {
    field: ControllerRenderProps<FinishRegistrationFormValues, "UserPlaysSurvivor">;
  }) => (
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
  );

  const renderPaymentTypeField = ({
    field,
    fieldState,
  }: {
    field: ControllerRenderProps<FinishRegistrationFormValues, "UserPaymentType">;
    fieldState: ControllerFieldState;
  }) => <ProfilePaymentTypeField field={field} fieldState={fieldState} />;

  const renderPaymentAccountField = ({
    field,
    fieldState,
  }: {
    field: ControllerRenderProps<FinishRegistrationFormValues, "UserPaymentAccount">;
    fieldState: ControllerFieldState;
  }) => (
    <ProfileTextField
      field={field}
      fieldState={fieldState}
      id="UserPaymentAccount"
      label={paymentAccountLabel}
      placeholder="Payment account"
    />
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
