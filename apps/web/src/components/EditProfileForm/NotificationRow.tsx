import { FormControl, FormField, FormItem, FormMessage } from "@nfl-pool-monorepo/ui/components/form";
import { Input } from "@nfl-pool-monorepo/ui/components/input";
import { Label } from "@nfl-pool-monorepo/ui/components/label";
import { Popover, PopoverContent, PopoverTrigger } from "@nfl-pool-monorepo/ui/components/popover";
import { Switch } from "@nfl-pool-monorepo/ui/components/switch";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { FC } from "react";
import type { Control, ControllerProps } from "react-hook-form";
import { PiQuestionDuotone } from "react-icons/pi";

import type { editProfileSchema } from "@/lib/validation";
import type { getUserNotifications } from "@/server/loaders/notification";

type FormValues = typeof editProfileSchema.infer;
type NotificationValue = FormValues["notifications"][number];
type Notification = Awaited<ReturnType<typeof getUserNotifications>>[number];

const toNotificationSwitchHandler = (onChange: (value: number) => void) => (checked: boolean) =>
  onChange(checked ? 1 : 0);

type NotificationRowProps = {
  control: Control<FormValues>;
  hasPushSubscription: boolean;
  index: number;
  notification: Notification;
  watchNotification: NotificationValue | undefined;
};

export const NotificationRow: FC<NotificationRowProps> = ({
  control,
  hasPushSubscription,
  index,
  notification,
  watchNotification,
}) => {
  const showHoursBefore =
    notification.NotificationTypeHasHours === 1 &&
    (watchNotification?.NotificationEmail === 1 ||
      watchNotification?.NotificationSMS === 1 ||
      (hasPushSubscription && watchNotification?.NotificationPushNotification === 1));

  const renderEmailSwitch: ControllerProps<FormValues, `notifications.${number}.NotificationEmail`>["render"] = ({
    field,
  }) => (
    <FormItem>
      <FormControl>
        <Switch
          aria-label={`${notification.NotificationTypeDescription} email notification`}
          checked={field.value === 1}
          disabled={notification.NotificationType === "Essentials"}
          onCheckedChange={toNotificationSwitchHandler(field.onChange)}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );

  const renderSmsSwitch: ControllerProps<FormValues, `notifications.${number}.NotificationSMS`>["render"] = ({
    field,
  }) => (
    <FormItem>
      <FormControl>
        <Switch
          aria-label={`${notification.NotificationTypeDescription} SMS notification`}
          checked={field.value === 1}
          onCheckedChange={toNotificationSwitchHandler(field.onChange)}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );

  const renderPushSwitch: ControllerProps<
    FormValues,
    `notifications.${number}.NotificationPushNotification`
  >["render"] = ({ field }) => (
    <FormItem>
      <FormControl>
        <Switch
          aria-label={`${notification.NotificationTypeDescription} push notification`}
          checked={field.value === 1}
          onCheckedChange={toNotificationSwitchHandler(field.onChange)}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );

  const renderEmailHoursBefore: ControllerProps<
    FormValues,
    `notifications.${number}.NotificationEmailHoursBefore`
  >["render"] = ({ field, fieldState }) => (
    <FormItem className="gap-0">
      <FormControl>
        <Input
          {...field}
          aria-label={`${notification.NotificationTypeDescription} email hours before`}
          className={cn("w-8 px-1 text-center", fieldState.error && "border-red-600")}
          max={48}
          min={1}
          value={field.value ?? ""}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );

  const renderSmsHoursBefore: ControllerProps<
    FormValues,
    `notifications.${number}.NotificationSMSHoursBefore`
  >["render"] = ({ field, fieldState }) => (
    <FormItem>
      <FormControl>
        <Input
          {...field}
          aria-label={`${notification.NotificationTypeDescription} SMS hours before`}
          className={cn("w-8 px-1 text-center", fieldState.error && "border-red-600")}
          max={48}
          min={1}
          value={field.value ?? ""}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );

  const renderPushHoursBefore: ControllerProps<
    FormValues,
    `notifications.${number}.NotificationPushNotificationHoursBefore`
  >["render"] = ({ field, fieldState }) => (
    <FormItem>
      <FormControl>
        <Input
          {...field}
          aria-label={`${notification.NotificationTypeDescription} push notification hours before`}
          className={cn("w-8 px-1 text-center", fieldState.error && "border-red-600")}
          max={48}
          min={1}
          value={field.value ?? ""}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );

  return (
    <div className="grid grid-cols-2">
      <Label className="items-start">
        {notification.NotificationTypeDescription}{" "}
        {!!notification.NotificationTypeTooltip && (
          <Popover>
            <PopoverTrigger aria-label="More information" className="mt-[-3px]" type="button">
              <PiQuestionDuotone className="size-5" />
            </PopoverTrigger>
            <PopoverContent className="max-w-[300px]">{notification.NotificationTypeTooltip}</PopoverContent>
          </Popover>
        )}
      </Label>

      <div className="flex justify-end gap-x-4">
        {notification.NotificationTypeHasEmail === 1 ? (
          <FormField control={control} name={`notifications.${index}.NotificationEmail`} render={renderEmailSwitch} />
        ) : (
          <div className="w-8" />
        )}

        {notification.NotificationTypeHasSMS === 1 ? (
          <FormField control={control} name={`notifications.${index}.NotificationSMS`} render={renderSmsSwitch} />
        ) : (
          <div className="w-8" />
        )}

        {hasPushSubscription && notification.NotificationTypeHasPushNotification === 1 ? (
          <FormField
            control={control}
            name={`notifications.${index}.NotificationPushNotification`}
            render={renderPushSwitch}
          />
        ) : (
          <div className="w-8" />
        )}
      </div>

      {!!showHoursBefore && (
        <div className="col-span-full flex justify-end items-center gap-x-4 mt-1">
          <div>Send how many hours before?</div>

          {watchNotification?.NotificationEmail === 1 ? (
            <FormField
              control={control}
              name={`notifications.${index}.NotificationEmailHoursBefore`}
              render={renderEmailHoursBefore}
            />
          ) : (
            <div className="w-10" />
          )}

          {watchNotification?.NotificationSMS === 1 ? (
            <FormField
              control={control}
              name={`notifications.${index}.NotificationSMSHoursBefore`}
              render={renderSmsHoursBefore}
            />
          ) : (
            <div className="w-8" />
          )}

          {hasPushSubscription && watchNotification?.NotificationPushNotification === 1 ? (
            <FormField
              control={control}
              name={`notifications.${index}.NotificationPushNotificationHoursBefore`}
              render={renderPushHoursBefore}
            />
          ) : (
            <div className="w-8" />
          )}
        </div>
      )}
    </div>
  );
};
