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

import { isEmailOn, isPushOn, isSmsOn, shouldShowHoursBefore } from "./notificationChannels";

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

const SWITCH_PLACEHOLDER = <div className="w-11 md:w-8" />;

const EmailSwitchSlot: FC<NotificationRowProps> = ({ control, index, notification }) => {
  const renderEmailSwitch: ControllerProps<FormValues, `notifications.${number}.NotificationEmail`>["render"] = ({
    field,
  }) => (
    <FormItem className="flex w-11 justify-center md:w-8">
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

  if (notification.NotificationTypeHasEmail !== 1) {
    return SWITCH_PLACEHOLDER;
  }

  return <FormField control={control} name={`notifications.${index}.NotificationEmail`} render={renderEmailSwitch} />;
};

const SmsSwitchSlot: FC<NotificationRowProps> = ({ control, index, notification }) => {
  const renderSmsSwitch: ControllerProps<FormValues, `notifications.${number}.NotificationSMS`>["render"] = ({
    field,
  }) => (
    <FormItem className="flex w-11 justify-center md:w-8">
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

  if (notification.NotificationTypeHasSMS !== 1) {
    return SWITCH_PLACEHOLDER;
  }

  return <FormField control={control} name={`notifications.${index}.NotificationSMS`} render={renderSmsSwitch} />;
};

const PushSwitchSlot: FC<NotificationRowProps> = ({ control, hasPushSubscription, index, notification }) => {
  const renderPushSwitch: ControllerProps<
    FormValues,
    `notifications.${number}.NotificationPushNotification`
  >["render"] = ({ field }) => (
    <FormItem className="flex w-11 justify-center md:w-8">
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

  if (!hasPushSubscription || notification.NotificationTypeHasPushNotification !== 1) {
    return SWITCH_PLACEHOLDER;
  }

  return (
    <FormField
      control={control}
      name={`notifications.${index}.NotificationPushNotification`}
      render={renderPushSwitch}
    />
  );
};

const EmailHoursSlot: FC<NotificationRowProps> = ({ control, index, notification, watchNotification }) => {
  const renderEmailHoursBefore: ControllerProps<
    FormValues,
    `notifications.${number}.NotificationEmailHoursBefore`
  >["render"] = ({ field, fieldState }) => (
    <FormItem className="gap-0">
      <FormControl>
        <Input
          {...field}
          aria-label={`${notification.NotificationTypeDescription} email hours before`}
          className={cn("w-11 px-1 text-center md:w-8", fieldState.error && "border-red-600")}
          max={48}
          min={1}
          value={field.value ?? ""}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );

  if (!isEmailOn(watchNotification)) {
    return <div className="w-11 md:w-10" />;
  }

  return (
    <FormField
      control={control}
      name={`notifications.${index}.NotificationEmailHoursBefore`}
      render={renderEmailHoursBefore}
    />
  );
};

const SmsHoursSlot: FC<NotificationRowProps> = ({ control, index, notification, watchNotification }) => {
  const renderSmsHoursBefore: ControllerProps<
    FormValues,
    `notifications.${number}.NotificationSMSHoursBefore`
  >["render"] = ({ field, fieldState }) => (
    <FormItem>
      <FormControl>
        <Input
          {...field}
          aria-label={`${notification.NotificationTypeDescription} SMS hours before`}
          className={cn("w-11 px-1 text-center md:w-8", fieldState.error && "border-red-600")}
          max={48}
          min={1}
          value={field.value ?? ""}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );

  if (!isSmsOn(watchNotification)) {
    return SWITCH_PLACEHOLDER;
  }

  return (
    <FormField
      control={control}
      name={`notifications.${index}.NotificationSMSHoursBefore`}
      render={renderSmsHoursBefore}
    />
  );
};

const PushHoursSlot: FC<NotificationRowProps> = ({
  control,
  hasPushSubscription,
  index,
  notification,
  watchNotification,
}) => {
  const renderPushHoursBefore: ControllerProps<
    FormValues,
    `notifications.${number}.NotificationPushNotificationHoursBefore`
  >["render"] = ({ field, fieldState }) => (
    <FormItem>
      <FormControl>
        <Input
          {...field}
          aria-label={`${notification.NotificationTypeDescription} push notification hours before`}
          className={cn("w-11 px-1 text-center md:w-8", fieldState.error && "border-red-600")}
          max={48}
          min={1}
          value={field.value ?? ""}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );

  if (!isPushOn(watchNotification, hasPushSubscription)) {
    return SWITCH_PLACEHOLDER;
  }

  return (
    <FormField
      control={control}
      name={`notifications.${index}.NotificationPushNotificationHoursBefore`}
      render={renderPushHoursBefore}
    />
  );
};

const HoursBeforeRow: FC<NotificationRowProps> = (props) => (
  <div className="col-span-full flex justify-end items-center gap-x-4 mt-1">
    <div>Send how many hours before?</div>
    <EmailHoursSlot {...props} />
    <SmsHoursSlot {...props} />
    <PushHoursSlot {...props} />
  </div>
);

export const NotificationRow: FC<NotificationRowProps> = (props) => {
  const { notification } = props;
  const showHoursBefore = shouldShowHoursBefore(notification, props.watchNotification, props.hasPushSubscription);

  return (
    <div className="grid grid-cols-2 py-3 md:py-0">
      <Label className="items-start">
        {notification.NotificationTypeDescription}{" "}
        {!!notification.NotificationTypeTooltip && (
          <Popover>
            <PopoverTrigger aria-label="More information" className="-m-3 -mt-[15px] p-3" type="button">
              <PiQuestionDuotone className="size-5" />
            </PopoverTrigger>
            <PopoverContent className="max-w-[300px]">{notification.NotificationTypeTooltip}</PopoverContent>
          </Popover>
        )}
      </Label>

      <div className="flex justify-end gap-x-4">
        <EmailSwitchSlot {...props} />
        <SmsSwitchSlot {...props} />
        <PushSwitchSlot {...props} />
      </div>

      {!!showHoursBefore && <HoursBeforeRow {...props} />}
    </div>
  );
};
