type ChannelFlags = {
  NotificationEmail?: number;
  NotificationPushNotification?: number;
  NotificationSMS?: number;
};

type NotificationType = { NotificationTypeHasHours: number };

const isFlagOn = (value: number | undefined): boolean => value === 1;

export const isEmailOn = (watch: ChannelFlags | undefined): boolean => isFlagOn(watch?.NotificationEmail);

export const isSmsOn = (watch: ChannelFlags | undefined): boolean => isFlagOn(watch?.NotificationSMS);

export const isPushOn = (watch: ChannelFlags | undefined, hasPushSubscription: boolean): boolean =>
  hasPushSubscription && isFlagOn(watch?.NotificationPushNotification);

export const shouldShowHoursBefore = (
  notification: NotificationType,
  watch: ChannelFlags | undefined,
  hasPushSubscription: boolean,
): boolean =>
  notification.NotificationTypeHasHours === 1 &&
  (isEmailOn(watch) || isSmsOn(watch) || isPushOn(watch, hasPushSubscription));
