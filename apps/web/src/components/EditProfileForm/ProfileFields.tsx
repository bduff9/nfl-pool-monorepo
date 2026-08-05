import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@nfl-pool-monorepo/ui/components/form";
import { Input } from "@nfl-pool-monorepo/ui/components/input";
import { PhoneInput } from "@nfl-pool-monorepo/ui/components/phone-input";
import { Popover, PopoverContent, PopoverTrigger } from "@nfl-pool-monorepo/ui/components/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@nfl-pool-monorepo/ui/components/select";
import { Tabs, TabsList, TabsTrigger } from "@nfl-pool-monorepo/ui/components/tabs";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import { type FC, useCallback } from "react";
import type { Control, ControllerProps } from "react-hook-form";
import { PiQuestionDuotone } from "react-icons/pi";

import { PaymentMethod } from "@/lib/constants";
import type { editProfileSchema } from "@/lib/validation";

import TextSeparator from "../TextSeparator/TextSeparator";

type FormValues = typeof editProfileSchema.infer;

type ProfileFieldsProps = {
  control: Control<FormValues>;
};

export const ProfileFields: FC<ProfileFieldsProps> = ({ control }) => {
  const renderEmailField: ControllerProps<FormValues, "UserEmail">["render"] = useCallback(
    ({ field }) => (
      <FormItem>
        <FormLabel className="required h-5">Email</FormLabel>
        <FormControl>
          <Input
            {...field}
            autoComplete="email"
            className="dark:bg-transparent border-0 shadow-none"
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

  const renderFirstNameField: ControllerProps<FormValues, "UserFirstName">["render"] = useCallback(
    ({ field, fieldState }) => (
      <FormItem>
        <FormLabel className="required h-5">First Name</FormLabel>
        <FormControl>
          <Input
            {...field}
            aria-invalid={!!fieldState.error}
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

  const renderLastNameField: ControllerProps<FormValues, "UserLastName">["render"] = useCallback(
    ({ field, fieldState }) => (
      <FormItem>
        <FormLabel className="required h-5">Last Name</FormLabel>
        <FormControl>
          <Input
            {...field}
            aria-invalid={!!fieldState.error}
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

  const renderTeamNameField: ControllerProps<FormValues, "UserTeamName">["render"] = useCallback(
    ({ field, fieldState }) => (
      <FormItem>
        <FormLabel className="h-5">
          Team Name &nbsp;<span className="text-xs text-muted-foreground">(Optional)</span>
        </FormLabel>
        <FormControl>
          <Input
            {...field}
            aria-invalid={!!fieldState.error}
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

  const renderPhoneField: ControllerProps<FormValues, "UserPhone">["render"] = useCallback(
    ({ field, fieldState }) => (
      <FormItem>
        <FormLabel className="h-5">
          Phone Number &nbsp;<span className="text-xs text-muted-foreground">(Optional)</span>&nbsp;
          <Popover>
            <PopoverTrigger aria-label="More information about phone number" type="button">
              <PiQuestionDuotone className="size-5" />
            </PopoverTrigger>
            <PopoverContent className="max-w-[300px]">
              If you would like to receive SMS notifications from the confidence pool, please enter a valid phone
              number. This is not required, however, you will need to enable the notifications you would like to receive
              after you enter a valid phone number.
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
    ),
    [],
  );

  const renderPaymentTypeField: ControllerProps<FormValues, "UserPaymentType">["render"] = useCallback(
    ({ field, fieldState }) => (
      <FormItem>
        <FormLabel className="required h-5">Payment Type</FormLabel>
        <Select onValueChange={field.onChange} value={field.value}>
          <FormControl>
            <SelectTrigger
              aria-label="Payment Type"
              className={cn("dark:bg-white w-full", fieldState.error && "border-red-600")}
            >
              <SelectValue placeholder="-- Select a payment type --" />
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

  const renderPaymentAccountField: ControllerProps<FormValues, "UserPaymentAccount">["render"] = useCallback(
    ({ field, fieldState }) => (
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

  const renderAutoPicksLeftField: ControllerProps<FormValues, "UserAutoPicksLeft">["render"] = useCallback(
    ({ field }) => (
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
    ),
    [],
  );

  const renderAutoPickStrategyField: ControllerProps<FormValues, "UserAutoPickStrategy">["render"] = useCallback(
    ({ field }) => (
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
    ),
    [],
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
