import type { editProfileSchema } from "@/lib/validation";
import type { getUserNotifications } from "@/server/loaders/notification";
import type { getCurrentUser } from "@/server/loaders/user";

type FormValues = typeof editProfileSchema.infer;
type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>;
type MyNotifications = Awaited<ReturnType<typeof getUserNotifications>>;

const MIN_PHONE_LENGTH = 10;

const orEmpty = (value: string | null): string => value ?? "";

const correctPhoneNumber = (phoneNumber: string | null): string | null => {
  if (!phoneNumber) {
    return null;
  }

  if (phoneNumber.startsWith("+1")) {
    return phoneNumber;
  }

  return `+1${phoneNumber}`;
};

export const buildDefaultValues = (currentUser: CurrentUser, myNotifications: MyNotifications): FormValues => ({
  notifications: myNotifications,
  UserAutoPickStrategy: currentUser.UserAutoPickStrategy,
  UserAutoPicksLeft: currentUser.UserAutoPicksLeft,
  UserEmail: currentUser.UserEmail,
  UserFirstName: orEmpty(currentUser.UserFirstName),
  UserLastName: orEmpty(currentUser.UserLastName),
  UserPaymentAccount: orEmpty(currentUser.UserPaymentAccount),
  UserPaymentType: currentUser.UserPaymentType ?? "Paypal",
  UserPhone: orEmpty(correctPhoneNumber(currentUser.UserPhone)),
  UserTeamName: orEmpty(currentUser.UserTeamName),
});

export const hasValidPhone = (phone: string, phoneErrorMessage: string | undefined): boolean =>
  phone.length >= MIN_PHONE_LENGTH && !phoneErrorMessage;

const withSmsOff = <T extends { NotificationSMS: number; NotificationSMSHoursBefore: number | null }>(
  notification: T,
): T => ({ ...notification, NotificationSMS: 0, NotificationSMSHoursBefore: null });

export const smsOffUnlessPhone = <T extends { NotificationSMS: number; NotificationSMSHoursBefore: number | null }>(
  hasPhone: boolean,
  notifications: Array<T>,
): Array<T> => (hasPhone ? notifications : notifications.map(withSmsOff));
