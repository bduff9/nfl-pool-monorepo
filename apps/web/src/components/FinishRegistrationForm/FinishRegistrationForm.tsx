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

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@nfl-pool-monorepo/ui/components/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@nfl-pool-monorepo/ui/components/form";
import { Input } from "@nfl-pool-monorepo/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@nfl-pool-monorepo/ui/components/select";
import { Tabs, TabsList, TabsTrigger } from "@nfl-pool-monorepo/ui/components/tabs";
import { cn } from "@nfl-pool-monorepo/utils/styles";

import { PaymentMethod } from "@/lib/constants";
import { useBeforeUnload } from "@/lib/hooks/useBeforeUnload";
import { getFirstName, getFullName, getLastName } from "@/lib/user";
import { finishRegistrationSchema } from "@/lib/zod";
import { type FormZSA, processFormErrors, processFormState } from "@/lib/zsa";
import type { getCurrentUser } from "@/server/loaders/user";
import "client-only";

import type { Status } from "@nfl-pool-monorepo/types";
import { Popover, PopoverContent, PopoverTrigger } from "@nfl-pool-monorepo/ui/components/popover";
import { useRouter } from "next/navigation";
import { type FC, useEffect, useState } from "react";
import { type SubmitHandler, useForm, useWatch } from "react-hook-form";
import { PiFootballDuotone, PiQuestionDuotone } from "react-icons/pi";
import type { z } from "zod";

import GoogleAuthButton from "../GoogleAuthButton/GoogleAuthButton";

type FinishRegistrationFormProps = {
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>;
  finishRegistration: FormZSA<typeof finishRegistrationSchema>;
  hasGoogle: boolean;
  seasonStatus: Status;
};

const FinishRegistrationForm: FC<FinishRegistrationFormProps> = ({
  currentUser,
  finishRegistration,
  hasGoogle,
  seasonStatus,
}) => {
  const router = useRouter();
  const form = useForm<z.infer<typeof finishRegistrationSchema>>({
    defaultValues: {
      UserEmail: currentUser.UserEmail,
      UserFirstName: getFirstName(currentUser),
      UserLastName: getLastName(currentUser),
      UserName: getFullName(currentUser),
      UserPaymentAccount: currentUser.UserPaymentAccount ?? "",
      UserPaymentType: currentUser.UserPaymentType ?? "Paypal",
      UserPlaysSurvivor: seasonStatus !== "Not Started" ? false : currentUser.UserPlaysSurvivor === 1,
      UserReferredByRaw: currentUser.UserReferredByRaw || "",
      UserTeamName: currentUser.UserTeamName || "",
    },
    resolver: zodResolver(finishRegistrationSchema),
  });
  const [showUntrusted, setShowUntrusted] = useState<boolean>(
    !currentUser.UserTrusted && !!currentUser.UserReferredByRaw,
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const userName = useWatch({ control: form.control, name: "UserName" });
  const userFirstName = useWatch({
    control: form.control,
    name: "UserFirstName",
  });
  const userLastName = useWatch({
    control: form.control,
    name: "UserLastName",
  });

  useBeforeUnload(form.formState.isDirty);

  useEffect(() => {
    if (userName.match(/\w{2,}\s\w{2,}/)) {
      return;
    }

    if (!(userFirstName && userLastName)) {
      return;
    }

    const fullName = `${userFirstName.trim()} ${userLastName.trim()}`;

    form.setValue("UserName", fullName, { shouldValidate: true });
  }, [userName, userFirstName, userLastName, form.setValue]);

  const onSubmit: SubmitHandler<z.infer<typeof finishRegistrationSchema>> = async (data) => {
    setIsLoading(true);

    try {
      const result = await finishRegistration(data);
      const isTrusted = result[0]?.metadata.isTrusted;

      setShowUntrusted(!isTrusted);
      processFormState(
        result,
        () => {
          if (isTrusted) {
            router.push("/");
          }
        },
        "You have successfully submitted your registration!",
      );
    } catch (error) {
      console.error("Error during finish registration submit:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (showUntrusted) {
    return (
      <div className="text-center">
        <h2 className="mb-4">Thanks for requesting access!</h2>
        <h2 className="mb-5">An admin will review your information and will notify you via email shortly.</h2>
      </div>
    );
  }

  const errorCount = Object.keys(form.formState.errors).length;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, processFormErrors)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
          <FormField
            control={form.control}
            name="UserEmail"
            render={({ field }) => (
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
            )}
          />

          <FormField
            control={form.control}
            name="UserFirstName"
            render={({ field, fieldState }) => (
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
            )}
          />

          <FormField
            control={form.control}
            name="UserLastName"
            render={({ field, fieldState }) => (
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
            )}
          />

          <FormField
            control={form.control}
            name="UserTeamName"
            render={({ field, fieldState }) => (
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
            )}
          />

          {currentUser.UserTrusted !== 1 && (
            <FormField
              control={form.control}
              name="UserReferredByRaw"
              render={({ field, fieldState }) => (
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
              )}
            />
          )}

          {seasonStatus === "Not Started" && (
            <FormField
              control={form.control}
              name="UserPlaysSurvivor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="required h-5">
                    Add on survivor game?&nbsp;
                    <Popover>
                      <PopoverTrigger>
                        <PiQuestionDuotone className="size-5" />
                      </PopoverTrigger>
                      <PopoverContent className="max-w-[300px]">
                        You can choose to join or leave the survivor pool up until the start of the first game of the
                        season. For more questions,{" "}
                        <a className="underline" href="/support#survivorpool" target="survivorFAQ">
                          click here
                        </a>
                      </PopoverContent>
                    </Popover>
                  </FormLabel>
                  <FormControl>
                    <Tabs onValueChange={(value) => field.onChange(value === "Yes")} value={field.value ? "Yes" : "No"}>
                      <TabsList>
                        <TabsTrigger value="No">No</TabsTrigger>
                        <TabsTrigger value="Yes">Yes</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="UserPaymentType"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="required h-5">Payment Type</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className={cn("dark:bg-white w-full", fieldState.error && "border-red-600")}>
                      <SelectValue placeholder="-- Select a payment type --" />
                    </SelectTrigger>
                    <SelectContent>
                      {PaymentMethod.map((paymentMethod) => (
                        <SelectItem key={paymentMethod} value={paymentMethod}>
                          {paymentMethod}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="UserPaymentAccount"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="required h-5">
                  Payment Account&nbsp;
                  <Popover>
                    <PopoverTrigger>
                      <PiQuestionDuotone className="size-5" />
                    </PopoverTrigger>
                    <PopoverContent className="max-w-[300px]">
                      If you want to receive any prize money, you need to enter your exact payment account information
                      here (i.e. email, username or phone number for your account).{" "}
                      <strong>This is your responsibility as we will not be chasing people down to pay them.</strong>
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
            )}
          />

          <div className="mt-6">
            <GoogleAuthButton isLinked={hasGoogle} />
          </div>
          <div className="grid md:col-span-2 text-center">
            <Button disabled={isLoading} type="submit" variant="primary">
              {isLoading ? (
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
        </div>
      </form>
    </Form>
  );
};

export default FinishRegistrationForm;
