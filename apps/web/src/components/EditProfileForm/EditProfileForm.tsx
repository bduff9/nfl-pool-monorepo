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
import { Label } from "@nfl-pool-monorepo/ui/components/label";
import { PhoneInput } from "@nfl-pool-monorepo/ui/components/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@nfl-pool-monorepo/ui/components/select";
import { Switch } from "@nfl-pool-monorepo/ui/components/switch";
import { Tabs, TabsList, TabsTrigger } from "@nfl-pool-monorepo/ui/components/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@nfl-pool-monorepo/ui/components/tooltip";
import { cn } from "@nfl-pool-monorepo/utils/styles";

import { PaymentMethod } from "@/lib/constants";
import { useBeforeUnload } from "@/lib/hooks/useBeforeUnload";
import { editProfileSchema } from "@/lib/zod";
import { type FormZSA, processFormErrors, processFormState } from "@/lib/zsa";
import type { getUserNotifications } from "@/server/loaders/notification";
import type { getCurrentUser } from "@/server/loaders/user";
import "client-only";

import { type FC, useEffect, useState } from "react";
import { type SubmitHandler, useForm, useWatch } from "react-hook-form";
import { PiFootballDuotone, PiQuestionDuotone } from "react-icons/pi";
import { toast } from "sonner";
import type { z } from "zod";

import { env } from "@/lib/env";
import { urlBase64ToUint8Array } from "@/lib/strings";
import { subscribeUser, unsubscribeUser } from "@/server/actions/device";

import GoogleAuthButton from "../GoogleAuthButton/GoogleAuthButton";
import InstallPrompt from "../InstallPrompt/InstallPrompt";
import TextSeparator from "../TextSeparator/TextSeparator";

type Props = {
  action: FormZSA<typeof editProfileSchema>;
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>;
  hasGoogle: boolean;
  myNotifications: Awaited<ReturnType<typeof getUserNotifications>>;
};

export const correctPhoneNumber = (phoneNumber: string | null): string | null => {
  if (!phoneNumber) {
    return null;
  }

  if (phoneNumber.startsWith("+1")) {
    return phoneNumber;
  }

  return `+1${phoneNumber}`;
};

const EditProfileForm: FC<Props> = ({ action, currentUser, myNotifications, hasGoogle }) => {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  const registerServiceWorker = async () => {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
    const sub = await registration.pushManager.getSubscription();
    setSubscription(sub);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: We only want this to run on mount
  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    } else {
      setIsSupported(false);
    }
  }, []);

  const subscribeToPush = async () => {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.subscribe({
      applicationServerKey: urlBase64ToUint8Array(env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      userVisibleOnly: true,
    });

    setSubscription(sub);

    await subscribeUser({ agent: navigator.userAgent, subscription: JSON.stringify(sub) });
  };

  const unsubscribeFromPush = async () => {
    await subscription?.unsubscribe();
    setSubscription(null);
    await unsubscribeUser({ agent: navigator.userAgent, subscription: JSON.stringify(subscription) });
  };

  const form = useForm<z.infer<typeof editProfileSchema>>({
    context: { myNotifications },
    defaultValues: {
      notifications: myNotifications,
      UserAutoPickStrategy: currentUser.UserAutoPickStrategy,
      UserAutoPicksLeft: currentUser.UserAutoPicksLeft,
      UserEmail: currentUser.UserEmail,
      UserFirstName: currentUser.UserFirstName ?? "",
      UserLastName: currentUser.UserLastName ?? "",
      UserPaymentAccount: currentUser.UserPaymentAccount ?? "",
      UserPaymentType: currentUser.UserPaymentType ?? "Paypal",
      UserPhone: correctPhoneNumber(currentUser.UserPhone) ?? "",
      UserTeamName: currentUser.UserTeamName ?? "",
    },
    resolver: zodResolver(editProfileSchema),
  });

  //TODO: remove this
  console.log("isDirty", form.formState.isDirty);

  const watchNotifications = useWatch({
    control: form.control,
    name: "notifications",
  });
  const watchPhone = useWatch({
    control: form.control,
    name: "UserPhone",
  });
  const errorCount = Object.keys(form.formState.errors).length;

  useBeforeUnload(form.formState.isDirty);

  useEffect(() => {
    watchNotifications.forEach((_, i) => {
      if (watchPhone.length < 10 || form.formState.errors.UserPhone?.message) {
        form.setValue(`notifications.${i}.NotificationSMS`, 0);
      }
    });
  }, [form.formState.errors.UserPhone?.message, watchPhone, form.setValue, watchNotifications.forEach]);

  const onSubmit: SubmitHandler<z.infer<typeof editProfileSchema>> = async (data) => {
    const toastId = toast.loading("Saving...", {
      closeButton: false,
      dismissible: false,
      duration: Infinity,
    });
    const result = await action(data);

    processFormState(
      result,
      () => {
        form.reset(form.watch(), { keepValues: true });
      },
      "Your profile changes have been successfully saved",
    );
    toast.dismiss(toastId);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, processFormErrors)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
          <TextSeparator className="col-span-full">Account Info</TextSeparator>

          <FormField
            control={form.control}
            name="UserEmail"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="required h-5">Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    aria-invalid={!!fieldState.error}
                    autoComplete="email"
                    className={cn("dark:bg-transparent border-0 shadow-none", fieldState.error && "border-red-600")}
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

          <div />

          <FormField
            control={form.control}
            name="UserFirstName"
            render={({ field, fieldState }) => (
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
            )}
          />

          <FormField
            control={form.control}
            name="UserPhone"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="h-5">
                  Phone Number <span className="text-xs text-muted-foreground">(Optional)</span>&nbsp;
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger type="button">
                        <PiQuestionDuotone className="size-5" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[300px]">
                        If you would like to receive SMS notifications from the confidence pool, please enter a valid
                        phone number. This is not required, however, you will need to enable the notifications you would
                        like to receive after you enter a valid phone number.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
            )}
          />

          <div className="row-span-3 grid gap-y-2">
            <TextSeparator>Payment Info</TextSeparator>

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
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger type="button">
                          <PiQuestionDuotone className="size-5" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[300px]">
                          If you want to receive any prize money, you need to enter your exact payment account
                          information here (i.e. email, username or phone number for your account).{" "}
                          <strong>
                            This is your responsibility as we will not be chasing people down to pay them.
                          </strong>
                          If entering phone number, please enter a valid phone number in the format +1 999 999 9999.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
          </div>

          <div className="row-span-3 grid gap-y-2">
            <TextSeparator>Auto Picks</TextSeparator>

            <FormField
              control={form.control}
              name="UserAutoPicksLeft"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="h-5">
                    Auto Picks Remaining
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger type="button">
                          <PiQuestionDuotone className="size-5" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[300px]">
                          These allow you to have the system automatically make a pick for you if you forget. Once a
                          game starts, if you have not made a pick for that game, a winner will be chosen with your
                          lowest point value based on the strategy you select below:
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
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      aria-invalid={!!fieldState.error}
                      autoComplete="off"
                      className={cn("dark:bg-transparent border-0 shadow-none", fieldState.error && "border-red-600")}
                      id="UserAutoPicksLeft"
                      placeholder="Auto picks remaining"
                      readOnly
                      type="number"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="UserAutoPickStrategy"
              render={({ field }) => (
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
              )}
            />
          </div>

          <TextSeparator className="col-span-full">Notifications</TextSeparator>

          <div className="flex justify-end gap-x-4">
            <div title="Notifications sent to your email address">Email</div>
            <div title="Notifications sent to your phone via text message">SMS</div>
            <div title="Notifications sent to your device via push notification">Push</div>
          </div>

          <div className="hidden md:flex justify-end gap-x-4">
            <div title="Notifications sent to your email address">Email</div>
            <div title="Notifications sent to your phone via text message">SMS</div>
            <div title="Notifications sent to your device via push notification">Push</div>
          </div>

          {myNotifications.map((notification, i) => (
            <div className="grid grid-cols-2" key={`notification-${notification.NotificationID}`}>
              <Label className="items-start">
                {notification.NotificationTypeDescription}{" "}
                {notification.NotificationTypeTooltip && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="-mt-[3px]" type="button">
                        <PiQuestionDuotone className="size-5" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[300px]">{notification.NotificationTypeTooltip}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </Label>

              <div className="flex justify-end gap-x-4">
                {notification.NotificationTypeHasEmail === 1 ? (
                  <FormField
                    control={form.control}
                    name={`notifications.${i}.NotificationEmail`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value === 1}
                            disabled={notification.NotificationType === "Essentials"}
                            onCheckedChange={(value) => field.onChange(value ? 1 : 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="w-8" />
                )}

                {notification.NotificationTypeHasSMS === 1 ? (
                  <FormField
                    control={form.control}
                    name={`notifications.${i}.NotificationSMS`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value === 1}
                            onCheckedChange={(value) => field.onChange(value ? 1 : 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="w-8" />
                )}

                {subscription && notification.NotificationTypeHasPushNotification === 1 ? (
                  <FormField
                    control={form.control}
                    name={`notifications.${i}.NotificationPushNotification`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value === 1}
                            onCheckedChange={(value) => field.onChange(value ? 1 : 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="w-8" />
                )}
              </div>

              {notification.NotificationTypeHasHours === 1 &&
                (watchNotifications[i]?.NotificationEmail === 1 || watchNotifications[i]?.NotificationSMS === 1) && (
                  <div className="col-span-full flex justify-end items-center gap-x-4 mt-1">
                    <div>Send how many hours before?</div>

                    {watchNotifications[i]?.NotificationEmail === 1 ? (
                      <FormField
                        control={form.control}
                        name={`notifications.${i}.NotificationEmailHoursBefore`}
                        render={({ field, fieldState }) => (
                          <FormItem className="gap-0">
                            <FormControl>
                              <Input
                                {...field}
                                className={cn(
                                  "w-8 dark:bg-white px-1 text-center",
                                  fieldState.error && "border-red-600",
                                )}
                                max={48}
                                min={1}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <div className="w-10" />
                    )}

                    {watchNotifications[i]?.NotificationSMS === 1 ? (
                      <FormField
                        control={form.control}
                        name={`notifications.${i}.NotificationSMSHoursBefore`}
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                className={cn(
                                  "w-8 dark:bg-white px-1 text-center",
                                  fieldState.error && "border-red-600",
                                )}
                                max={48}
                                min={1}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <div className="w-8" />
                    )}

                    {!!subscription && watchNotifications[i]?.NotificationPushNotification === 1 ? (
                      <FormField
                        control={form.control}
                        name={`notifications.${i}.NotificationPushNotificationHoursBefore`}
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                className={cn(
                                  "w-8 dark:bg-white px-1 text-center",
                                  fieldState.error && "border-red-600",
                                )}
                                max={48}
                                min={1}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <div className="w-8" />
                    )}
                  </div>
                )}
            </div>
          ))}

          {isSupported !== null && (
            <div className="col-span-full my-4 text-center">
              {isSupported ? (
                subscription ? (
                  <div>
                    <p>
                      <Button onClick={unsubscribeFromPush} type="button" variant="danger">
                        Click here to disable push notifications in the current browser.
                      </Button>
                    </p>
                  </div>
                ) : (
                    <p>
                      <Button onClick={subscribeToPush} type="button" variant="primary">
                        Click here to enable push notifications in the current browser.
                      </Button>
                    </p>
                )
              ) : (
                  <InstallPrompt />
              )}
            </div>
          )}

          <TextSeparator className="col-span-full">Quick Login</TextSeparator>
          <div className="text-center">Linking your account makes logging in as simple as a single click</div>
          <div />
          <div className="flex justify-center mb-2">
            <GoogleAuthButton isLinked={hasGoogle} />
          </div>
          <div />
          <div className="grid border-t border-black pt-3 mt-3 col-span-full">
            <Button disabled={form.formState.isSubmitting} type="submit" variant="primary">
              {form.formState.isSubmitting ? (
                <>
                  <PiFootballDuotone className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
            {errorCount > 0 && (
              <div className="text-red-600" role="alert">
                Please fix {errorCount} {errorCount === 1 ? "error" : "errors"} above
              </div>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
};

export default EditProfileForm;
