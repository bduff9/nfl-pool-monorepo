import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@nfl-pool-monorepo/ui/components/form";
import { Input } from "@nfl-pool-monorepo/ui/components/input";
import { PhoneInput } from "@nfl-pool-monorepo/ui/components/phone-input";
import { Popover, PopoverContent, PopoverTrigger } from "@nfl-pool-monorepo/ui/components/popover";
import { Tabs, TabsList, TabsTrigger } from "@nfl-pool-monorepo/ui/components/tabs";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { FC } from "react";
import type { Control, ControllerProps } from "react-hook-form";
import { PiQuestionDuotone } from "react-icons/pi";

import type { editProfileSchema } from "@/lib/validation";

import { ProfilePaymentTypeField, ProfileTextField } from "../ProfileFormFields/ProfileFormFields";
import { paymentAccountLabel, teamNameLabel } from "../ProfileFormFields/profileFieldLabels";
import TextSeparator from "../TextSeparator/TextSeparator";

type FormValues = typeof editProfileSchema.infer;

type ProfileFieldsProps = {
  control: Control<FormValues>;
};

export const ProfileFields: FC<ProfileFieldsProps> = ({ control }) => {
  const renderEmailField: ControllerProps<FormValues, "UserEmail">["render"] = ({ field, fieldState }) => (
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

  const renderFirstNameField: ControllerProps<FormValues, "UserFirstName">["render"] = ({ field, fieldState }) => (
    <ProfileTextField
      autoComplete="given-name"
      field={field}
      fieldState={fieldState}
      id="UserFirstName"
      label="First Name"
      placeholder="First name"
    />
  );

  const renderLastNameField: ControllerProps<FormValues, "UserLastName">["render"] = ({ field, fieldState }) => (
    <ProfileTextField
      autoComplete="family-name"
      field={field}
      fieldState={fieldState}
      id="UserLastName"
      label="Last Name"
      placeholder="Last name"
    />
  );

  const renderTeamNameField: ControllerProps<FormValues, "UserTeamName">["render"] = ({ field, fieldState }) => (
    <ProfileTextField
      field={field}
      fieldState={fieldState}
      id="UserTeamName"
      label={teamNameLabel}
      placeholder="Team name"
      required={false}
    />
  );

  const renderPhoneField: ControllerProps<FormValues, "UserPhone">["render"] = ({ field, fieldState }) => (
    <FormItem>
      <FormLabel className="h-5">
        Phone Number &nbsp;<span className="text-xs text-muted-foreground">(Optional)</span>&nbsp;
        <Popover>
          <PopoverTrigger aria-label="More information about phone number" type="button">
            <PiQuestionDuotone className="size-5" />
          </PopoverTrigger>
          <PopoverContent className="max-w-[300px]">
            If you would like to receive SMS notifications from the confidence pool, please enter a valid phone number.
            This is not required, however, you will need to enable the notifications you would like to receive after you
            enter a valid phone number.
          </PopoverContent>
        </Popover>
      </FormLabel>
      <FormControl>
        <PhoneInput
          {...field}
          autoComplete="phone"
          className={cn(fieldState.error && "border-red-600")}
          defaultCountry="US"
          placeholder="Enter a phone number"
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );

  const renderPaymentTypeField: ControllerProps<FormValues, "UserPaymentType">["render"] = ({ field, fieldState }) => (
    <ProfilePaymentTypeField field={field} fieldState={fieldState} />
  );

  const renderPaymentAccountField: ControllerProps<FormValues, "UserPaymentAccount">["render"] = ({
    field,
    fieldState,
  }) => (
    <ProfileTextField
      field={field}
      fieldState={fieldState}
      id="UserPaymentAccount"
      label={paymentAccountLabel}
      placeholder="Payment account"
    />
  );

  const renderAutoPicksLeftField: ControllerProps<FormValues, "UserAutoPicksLeft">["render"] = ({ field }) => (
    <FormItem>
      <FormLabel className="h-5">
        Auto Picks Remaining&nbsp;
        <Popover>
          <PopoverTrigger aria-label="More information about auto picks" type="button">
            <PiQuestionDuotone className="size-5" />
          </PopoverTrigger>
          <PopoverContent className="max-w-[300px]">
            These allow you to have the system automatically make a pick for you if you forget. Once a game starts, if
            you have not made a pick for that game, a winner will be chosen with your lowest point value based on the
            strategy you select below:
            <ul>
              <li>
                <strong>Home:</strong> the home team will be picked
              </li>
              <li>
                <strong>Away:</strong> the visiting team will be picked
              </li>
              <li>
                <strong>Random:</strong> a randomly selected team will be picked
              </li>
            </ul>
          </PopoverContent>
        </Popover>
      </FormLabel>
      <FormControl>
        <Input
          {...field}
          autoComplete="off"
          className="dark:bg-transparent border-0 shadow-none"
          id="UserAutoPicksLeft"
          placeholder="Auto picks remaining"
          readOnly
          type="number"
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );

  const renderAutoPickStrategyField: ControllerProps<FormValues, "UserAutoPickStrategy">["render"] = ({ field }) => (
    <FormItem>
      <FormLabel className="required h-5">Auto Pick Strategy</FormLabel>
      <FormControl>
        <Tabs onValueChange={field.onChange} value={field.value}>
          <TabsList>
            <TabsTrigger value="Home">Home</TabsTrigger>
            <TabsTrigger value="Away">Away</TabsTrigger>
            <TabsTrigger value="Random">Random</TabsTrigger>
          </TabsList>
        </Tabs>
      </FormControl>
      <FormMessage />
    </FormItem>
  );

  return (
    <>
      <TextSeparator className="col-span-full">Account Info</TextSeparator>

      <FormField control={control} name="UserEmail" render={renderEmailField} />

      <div />

      <FormField control={control} name="UserFirstName" render={renderFirstNameField} />

      <FormField control={control} name="UserLastName" render={renderLastNameField} />

      <FormField control={control} name="UserTeamName" render={renderTeamNameField} />

      <FormField control={control} name="UserPhone" render={renderPhoneField} />

      <div className="row-span-3 grid gap-y-2">
        <TextSeparator>Payment Info</TextSeparator>

        <FormField control={control} name="UserPaymentType" render={renderPaymentTypeField} />

        <FormField control={control} name="UserPaymentAccount" render={renderPaymentAccountField} />
      </div>

      <div className="row-span-3 grid gap-y-2">
        <TextSeparator>Auto Picks</TextSeparator>

        <FormField control={control} name="UserAutoPicksLeft" render={renderAutoPicksLeftField} />

        <FormField control={control} name="UserAutoPickStrategy" render={renderAutoPickStrategyField} />
      </div>
    </>
  );
};
