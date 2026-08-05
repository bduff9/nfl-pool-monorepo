import { weekSchema } from "@nfl-pool-monorepo/utils/validation";
import { type } from "arktype";
import { isValidPhoneNumber } from "libphonenumber-js";

import { AdminEmailTo, AdminEmailType, AutoPickStrategy, PaymentMethod } from "./constants";

export const serverActionResultSchema = type({
  metadata: "Record<string, string | number | boolean>",
  status: "'Success' | 'Unset'",
});

export type ServerActionResult = typeof serverActionResultSchema.infer;

const gameIdSchema = type("101 <= number.integer <= 1816");

const teamIdSchema = type("1 <= number.integer <= 33");

export const autoPickSchema = type({
  type: type.enumerated(...AutoPickStrategy),
  week: weekSchema,
});

export const setMyPickSchema = type({
  gameID: gameIdSchema.or("null"),
  points: type("1 <= number.integer <= 16"),
  teamID: teamIdSchema.or("null"),
  week: weekSchema,
});

const coerceNullableHours = type("string | number | null").pipe((v) => {
  if (v === null) return null;
  return typeof v === "number" ? v : Number(v);
}, type("1 <= number.integer <= 48").or("null"));

const coercePositiveInt = type("string | number").pipe(
  (v) => (typeof v === "number" ? v : Number(v)),
  type("number.integer >= 1"),
);

export const editProfileSchema = type({
  notifications: type({
    NotificationEmail: "number.integer",
    NotificationEmailHoursBefore: coerceNullableHours,
    NotificationID: "number.integer",
    NotificationPushNotification: "number.integer",
    NotificationPushNotificationHoursBefore: coerceNullableHours,
    NotificationSMS: "number.integer",
    NotificationSMSHoursBefore: coerceNullableHours,
    NotificationType: "string >= 1",
  }).array(),
  UserAutoPickStrategy: type.enumerated(...AutoPickStrategy),
  UserAutoPicksLeft: type("0 <= number.integer <= 3"),
  UserEmail: "string.email",
  UserFirstName: type("string")
    .pipe((s) => s.trim())
    .narrow((s, ctx) => s.length >= 2 || ctx.reject("Please enter your first name")),
  UserLastName: type("string")
    .pipe((s) => s.trim())
    .narrow((s, ctx) => s.length >= 2 || ctx.reject("Please enter your surname")),
  UserPaymentAccount: type("string")
    .pipe((s) => s.trim())
    .narrow((s, ctx) => s.length >= 2 || ctx.reject("Payment account is required")),
  UserPaymentType: type.enumerated(...PaymentMethod),
  UserPhone: type("string")
    .pipe((s) => s.trim())
    .narrow((s, ctx) => s === "" || isValidPhoneNumber(s) || ctx.reject("Please enter a valid phone number")),
  UserTeamName: type("string").pipe((s) => s.trim()),
}).narrow((data, ctx) => {
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.UserPaymentAccount);
  const isPhone = isValidPhoneNumber(data.UserPaymentAccount, "US");
  const isUsername = /^[\w-]{3,20}$/.test(data.UserPaymentAccount);

  if (data.UserPaymentType === "Zelle") {
    if (!(isEmail || isPhone)) {
      return ctx.reject({
        expected: "account phone number or email address",
        path: ["UserPaymentAccount"],
      });
    }
  } else if (!(isEmail || isPhone || isUsername)) {
    return ctx.reject({
      expected: "account username, phone number or email address",
      path: ["UserPaymentAccount"],
    });
  }
  return true;
});

export const emailPreviewSchema = type({
  body: type("string").pipe((s) => s.trim()),
  emailType: type.enumerated(...AdminEmailType),
  preview: type("string").pipe((s) => s.trim()),
  subject: type("string").pipe((s) => s.trim()),
  userFirstName: type("string").pipe((s) => s.trim()),
});

export const finishRegistrationSchema = type({
  UserEmail: "string.email",
  UserFirstName: type("string")
    .pipe((s) => s.trim())
    .narrow((s, ctx) => s.length >= 2 || ctx.reject("Please enter your first name")),
  UserLastName: type("string")
    .pipe((s) => s.trim())
    .narrow((s, ctx) => s.length >= 2 || ctx.reject("Please enter your surname")),
  UserName: type("string")
    .pipe((s) => s.trim())
    .narrow((s, ctx) => s.length >= 2 || ctx.mustBe("at least 2 characters")),
  UserPaymentAccount: type("string")
    .pipe((s) => s.trim())
    .narrow((s, ctx) => s.length >= 2 || ctx.reject("Payment account is required")),
  UserPaymentType: type.enumerated(...PaymentMethod),
  UserPlaysSurvivor: "boolean",
  UserReferredByRaw: type("string")
    .pipe((s) => s.trim())
    .narrow(
      (s, ctx) => /\w{2,}\s\w{2,}/.test(s) || ctx.reject("Please input the full name of the person that invited you"),
    ),
  UserTeamName: type("string").pipe((s) => s.trim()),
}).narrow((data, ctx) => {
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.UserPaymentAccount);
  const isPhone = isValidPhoneNumber(data.UserPaymentAccount, "US");
  const isUsername = /^[\w-]{3,20}$/.test(data.UserPaymentAccount);

  if (data.UserPaymentType === "Zelle") {
    if (!(isEmail || isPhone)) {
      return ctx.reject({
        expected: "account phone number or email address",
        path: ["UserPaymentAccount"],
      });
    }
  } else if (!(isEmail || isPhone || isUsername)) {
    return ctx.reject({
      expected: "account username, phone number or email address",
      path: ["UserPaymentAccount"],
    });
  }
  return true;
});

export const loginSchema = type({
  "confirmPassword?": "string",
  email: "string.email",
  isLogin: "boolean",
  password: "string >= 6",
}).narrow((data, ctx) => {
  if (!data.isLogin && data.password !== data.confirmPassword) {
    return ctx.reject({
      expected: "matching passwords",
      path: ["confirmPassword"],
    });
  }
  return true;
});

export const makeSurvivorPickSchema = type({
  gameID: gameIdSchema,
  teamID: teamIdSchema.or("null"),
  week: weekSchema,
});

export const payoutsSchema = type({
  overall1stPrize: coercePositiveInt,
  overall2ndPrize: coercePositiveInt,
  overall3rdPrize: coercePositiveInt,
  survivor1stPrize: coercePositiveInt,
  survivor2ndPrize: coercePositiveInt,
  weekly1stPrize: coercePositiveInt,
  weekly2ndPrize: coercePositiveInt,
});

export const restoreBackupSchema = type({
  backupName: "string >= 5",
});

export const sendAdminEmailSchema = type({
  body: "string",
  emailType: type.enumerated(...AdminEmailType),
  preview: "string",
  sendTo: type.enumerated(...AdminEmailTo),
  subject: "string",
  userEmail: type("string.email").or("null"),
  userFirstName: type("string | null").pipe((v) => (typeof v === "string" ? v.trim() : v)),
}).narrow((data, ctx) => {
  if (data.sendTo === "New" && (!data.userEmail || !data.userFirstName)) {
    return ctx.reject({
      expected: "user email and first name for new recipients",
      path: ["userEmail"],
    });
  }
  if (data.emailType === "Custom" && (!data.subject || !data.preview || !data.body)) {
    return ctx.reject({
      expected: "subject, preview, and body for custom emails",
      path: ["subject"],
    });
  }
  return true;
});

export const updateMyTiebreakerScoreSchema = type({
  score: "number.integer >= 2",
  week: weekSchema,
});

export const validateMyPicksSchema = type({
  lastScore: "number.integer >= 0",
  unused: type("1 <= number.integer <= 16").array(),
  week: weekSchema,
});

export const forgotPasswordEmailSchema = type({
  email: type("string.email").describe("a valid email address"),
});

export const verifyOtpSchema = type({
  confirmPassword: type("string").narrow(
    (s, ctx) => s.length >= 8 || ctx.reject("Password must be at least 8 characters"),
  ),
  email: "string.email",
  newPassword: type("string").narrow((s, ctx) => s.length >= 8 || ctx.reject("Password must be at least 8 characters")),
  otp: type("string")
    .narrow((s, ctx) => s.length === 6 || ctx.reject("OTP must be 6 digits"))
    .narrow((s, ctx) => /^\d+$/.test(s) || ctx.reject("OTP must contain only numbers")),
}).narrow((data, ctx) => {
  if (data.newPassword !== data.confirmPassword) {
    return ctx.reject({
      expected: "matching passwords",
      path: ["confirmPassword"],
    });
  }
  return true;
});
