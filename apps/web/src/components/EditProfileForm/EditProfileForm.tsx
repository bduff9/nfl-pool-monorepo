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

import { arktypeResolver } from "@hookform/resolvers/arktype";
import { Button } from "@nfl-pool-monorepo/ui/components/button";
import { Form } from "@nfl-pool-monorepo/ui/components/form";
import { cn } from "@nfl-pool-monorepo/utils/styles";

import { onActionError } from "@/lib/actionErrorToast";
import { processFormErrors, toArktypeResolver } from "@/lib/form-errors";
import { useBeforeUnload } from "@/lib/hooks/useBeforeUnload";
import { usePushNotifications } from "@/lib/hooks/usePushNotifications";
import { editProfileSchema } from "@/lib/validation";
import type { editMyProfile } from "@/server/actions/user";
import type { getUserNotifications } from "@/server/loaders/notification";
import type { getCurrentUser } from "@/server/loaders/user";
import "client-only";

import { useAction } from "next-safe-action/hooks";
import { type FC, useRef } from "react";
import { type SubmitHandler, useForm, useWatch } from "react-hook-form";
import { PiFootballDuotone } from "react-icons/pi";
import { toast } from "sonner";

import GoogleAuthButton from "../GoogleAuthButton/GoogleAuthButton";
import InstallPrompt from "../InstallPrompt/InstallPrompt";
import TextSeparator from "../TextSeparator/TextSeparator";
import { buildDefaultValues, hasValidPhone, smsOffUnlessPhone } from "./editProfileValues";
import { NotificationRow } from "./NotificationRow";
import { ProfileFields } from "./ProfileFields";

type Props = {
  action: typeof editMyProfile;
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>;
  hasGoogle: boolean;
  myNotifications: Awaited<ReturnType<typeof getUserNotifications>>;
};

const ChannelHeader: FC<{ className?: string }> = ({ className }) => (
  <div className={cn("flex justify-end gap-x-4", className)}>
    <div className="w-11 text-center md:w-auto" title="Notifications sent to your email address">
      Email
    </div>
    <div className="w-11 text-center md:w-auto" title="Notifications sent to your phone via text message">
      SMS
    </div>
    <div className="w-11 text-center md:w-auto" title="Notifications sent to your device via push notification">
      Push
    </div>
  </div>
);

const dismissToast = (toastId: string | number | undefined): void => {
  if (toastId) toast.dismiss(toastId);
};

const PushNotificationSection: FC<{ push: ReturnType<typeof usePushNotifications> }> = ({ push }) => {
  const { isSubscribing, isSupported, subscribeToPush, subscription, unsubscribeFromPush } = push;

  if (!isSupported) {
    return <InstallPrompt />;
  }

  if (subscription) {
    return (
      <div>
        <p>
          <Button onClick={unsubscribeFromPush} type="button" variant="danger">
            Click here to disable push notifications in the current browser.
          </Button>
        </p>
      </div>
    );
  }

  return (
    <p>
      <Button disabled={isSubscribing} onClick={subscribeToPush} type="button" variant="primary">
        {isSubscribing ? "Enabling..." : "Click here to enable push notifications in the current browser."}
      </Button>
    </p>
  );
};

const SubmitSection: FC<{ errorCount: number; isPending: boolean }> = ({ errorCount, isPending }) => (
  <div className="grid border-t border-border pt-3 mt-3 col-span-full">
    <Button disabled={isPending} type="submit" variant="primary">
      {isPending ? (
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
);

const EditProfileForm: FC<Props> = ({ action, currentUser, myNotifications, hasGoogle }) => {
  const pushNotifications = usePushNotifications();
  const { isSupported, subscription } = pushNotifications;

  const form = useForm<typeof editProfileSchema.infer>({
    context: { myNotifications },
    defaultValues: buildDefaultValues(currentUser, myNotifications),
    resolver: toArktypeResolver(arktypeResolver(editProfileSchema)),
  });

  const watchNotifications = useWatch({
    control: form.control,
    name: "notifications",
  });
  const errorCount = Object.keys(form.formState.errors).length;

  const toastIdRef = useRef<string | number | undefined>(undefined);

  const { execute, isPending } = useAction(action, {
    onError: onActionError,
    onSettled: () => {
      dismissToast(toastIdRef.current);
    },
    onSuccess: () => {
      toast.success("Your profile changes have been successfully saved");
      // react-doctor-disable-next-line effect-needs-cleanup, react-hooks-js/incompatible-library -- form.watch() with no args returns a snapshot, not a subscription; react-hook-form's watch() return can't be memoized, that's the library's design
      form.reset(form.watch(), { keepValues: true });
    },
  });

  useBeforeUnload(form.formState.isDirty);

  const onSubmit: SubmitHandler<typeof editProfileSchema.infer> = (data) => {
    toastIdRef.current = toast.loading("Saving...", {
      closeButton: false,
      dismissible: false,
      duration: Infinity,
    });

    // A phone number is required for SMS notifications - if it's missing or invalid, don't submit
    // SMS as enabled even if the toggle was left on before the phone field became invalid.
    const hasPhone = hasValidPhone(data.UserPhone, form.formState.errors.UserPhone?.message);
    const notifications = smsOffUnlessPhone(hasPhone, data.notifications);

    // Mirror what is saved so the toggles show SMS off and the post-save form reset doesn't restore them.
    form.setValue("notifications", notifications);
    execute({ ...data, notifications });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, processFormErrors)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
          <ProfileFields control={form.control} />

          <TextSeparator className="col-span-full">Notifications</TextSeparator>

          {/* Notification rows fill both grid columns on wider screens, so each column needs its own header. */}
          <ChannelHeader />
          <ChannelHeader className="hidden md:flex" />

          {myNotifications.map((notification, i) => (
            <NotificationRow
              control={form.control}
              hasPushSubscription={!!subscription}
              index={i}
              key={`notification-${notification.NotificationID}`}
              notification={notification}
              watchNotification={watchNotifications[i]}
            />
          ))}

          {isSupported !== null && (
            <div className="col-span-full my-4 text-center">
              <PushNotificationSection push={pushNotifications} />
            </div>
          )}

          <TextSeparator className="col-span-full">Quick Login</TextSeparator>
          <div className="text-center">Linking your account makes logging in as simple as a single click</div>
          <div />
          <div className="flex justify-center mb-2">
            <GoogleAuthButton isLinked={hasGoogle} />
          </div>
          <div />
          <SubmitSection errorCount={errorCount} isPending={isPending} />
        </div>
      </form>
    </Form>
  );
};

export default EditProfileForm;
