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

type SwitchFieldName = "NotificationEmail" | "NotificationPushNotification" | "NotificationSMS";

type NotificationSwitchFieldProps = {
  control: Control<FormValues>;
  disabled?: boolean;
  index: number;
  label: string;
  name: SwitchFieldName;
};

const NotificationSwitchField: FC<NotificationSwitchFieldProps> = ({ control, disabled, index, label, name }) => {
  const renderSwitch: ControllerProps<FormValues, `notifications.${number}.${SwitchFieldName}`>["render"] = ({
    field,
  }) => (
    <FormItem className="flex w-11 justify-center md:w-8">
      <FormControl>
        <Switch
          aria-label={label}
          checked={field.value === 1}
          disabled={disabled}
          onCheckedChange={toNotificationSwitchHandler(field.onChange)}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );

  return <FormField control={control} name={`notifications.${index}.${name}`} render={renderSwitch} />;
};

type HoursFieldName =
  | "NotificationEmailHoursBefore"
  | "NotificationPushNotificationHoursBefore"
  | "NotificationSMSHoursBefore";

type NotificationHoursFieldProps = {
  control: Control<FormValues>;
  index: number;
  itemClassName?: string;
  label: string;
  name: HoursFieldName;
};

const NotificationHoursField: FC<NotificationHoursFieldProps> = ({ control, index, itemClassName, label, name }) => {
  const renderHoursBefore: ControllerProps<FormValues, `notifications.${number}.${HoursFieldName}`>["render"] = ({
    field,
    fieldState,
  }) => (
    <FormItem className={itemClassName}>
      <FormControl>
        <Input
          {...field}
          aria-label={label}
          className={cn("w-11 px-1 text-center md:w-8", fieldState.error && "border-red-600")}
          max={48}
          min={1}
          value={field.value ?? ""}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );

  return <FormField control={control} name={`notifications.${index}.${name}`} render={renderHoursBefore} />;
};

const EmailSwitchSlot: FC<NotificationRowProps> = ({ control, index, notification }) => {
  if (notification.NotificationTypeHasEmail !== 1) {
    return SWITCH_PLACEHOLDER;
  }

  return (
    <NotificationSwitchField
      control={control}
      disabled={notification.NotificationType === "Essentials"}
      index={index}
      label={`${notification.NotificationTypeDescription} email notification`}
      name="NotificationEmail"
    />
  );
};

const SmsSwitchSlot: FC<NotificationRowProps> = ({ control, index, notification }) => {
  if (notification.NotificationTypeHasSMS !== 1) {
    return SWITCH_PLACEHOLDER;
  }

  return (
    <NotificationSwitchField
      control={control}
      index={index}
      label={`${notification.NotificationTypeDescription} SMS notification`}
      name="NotificationSMS"
    />
  );
};

const PushSwitchSlot: FC<NotificationRowProps> = ({ control, hasPushSubscription, index, notification }) => {
  if (!hasPushSubscription || notification.NotificationTypeHasPushNotification !== 1) {
    return SWITCH_PLACEHOLDER;
  }

  return (
    <NotificationSwitchField
      control={control}
      index={index}
      label={`${notification.NotificationTypeDescription} push notification`}
      name="NotificationPushNotification"
    />
  );
};

const EmailHoursSlot: FC<NotificationRowProps> = ({ control, index, notification, watchNotification }) => {
  if (!isEmailOn(watchNotification)) {
    return <div className="w-11 md:w-10" />;
  }

  return (
    <NotificationHoursField
      control={control}
      index={index}
      itemClassName="gap-0"
      label={`${notification.NotificationTypeDescription} email hours before`}
      name="NotificationEmailHoursBefore"
    />
  );
};

const SmsHoursSlot: FC<NotificationRowProps> = ({ control, index, notification, watchNotification }) => {
  if (!isSmsOn(watchNotification)) {
    return SWITCH_PLACEHOLDER;
  }

  return (
    <NotificationHoursField
      control={control}
      index={index}
      label={`${notification.NotificationTypeDescription} SMS hours before`}
      name="NotificationSMSHoursBefore"
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
  if (!isPushOn(watchNotification, hasPushSubscription)) {
    return SWITCH_PLACEHOLDER;
  }

  return (
    <NotificationHoursField
      control={control}
      index={index}
      label={`${notification.NotificationTypeDescription} push notification hours before`}
      name="NotificationPushNotificationHoursBefore"
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
