import { WEEKS_IN_SEASON } from "@nfl-pool-monorepo/utils/constants";
import { isValidPhoneNumber } from "libphonenumber-js";
import { z } from "zod";

import { AdminEmailFormat, AdminEmailTo, AdminEmailType, AutoPickStrategy, PaymentMethod } from "./constants";

export const stringToJSONSchema = z.string().nullish()
  .transform((str, ctx): z.infer<ReturnType<typeof JSON.parse>> => {
    try {
      if (str == null) {
        return str;
      }

      return JSON.parse(str);
    } catch ( e ) {
      ctx.addIssue({ code: 'custom', message: 'Invalid JSON' });

      return z.NEVER;
    }
});

export const serverActionResultSchema = z.object({
  metadata: z.record(z.string(), z.union([z.boolean(), z.number(), z.string()])),
  status: z.enum(["Success", "Unset"]),
});

export type ServerActionResult = z.infer<typeof serverActionResultSchema>;

export const gameIdSchema = z.number().int().min(101).max(1816);

export const teamIdSchema = z.number().int().min(1).max(33);

export const weekSchema = z.number().min(1).max(WEEKS_IN_SEASON);

export const autoPickSchema = z.object({
	type: z.enum(AutoPickStrategy, { message: 'Please select a valid auto pick strategy' }),
	week: weekSchema,
});

export const setMyPickSchema = z.object({
	gameID: gameIdSchema.nullable(),
	points: z.number().int().min(1).max(16),
	teamID: teamIdSchema.nullable(),
	week: weekSchema,
});

export const editProfileSchema = z
  .object({
    notifications: z.array(z.object({
      NotificationEmail: z.number().int(),
      NotificationEmailHoursBefore: z.coerce.number().int().min(1).max(48).nullable(),
      NotificationID: z.number().int(),
      NotificationPushNotification: z.number().int(),
      NotificationPushNotificationHoursBefore: z.coerce.number().int().min(1).max(48).nullable(),
      NotificationSMS: z.number().int(),
      NotificationSMSHoursBefore: z.coerce.number().int().min(1).max(48).nullable(),
      NotificationType: z.string().min(1),
    })),
    UserAutoPickStrategy: z.enum(AutoPickStrategy, { message: 'Please select a valid auto pick strategy' }),
    UserAutoPicksLeft: z.number().int().min(0).max(3),
    UserEmail: z.string().email(),
    UserFirstName: z.string().trim().min(2, "Please enter your first name"),
    UserLastName: z.string().trim().min(2, "Please enter your surname"),
    UserName: z.string().trim().min(2),
    UserPaymentAccount: z.string().trim().min(2, "Payment account is required"),
    UserPaymentType: z.enum(PaymentMethod, {
      message: "Please select an account type",
    }),
    UserPhone: z.string().trim().refine(isValidPhoneNumber, "Please enter a valid phone number").or(z.literal("")),
    UserTeamName: z.string().trim()
  })
  .superRefine((data, ctx) => {
    const emailResult = z.string().email().safeParse(data.UserPaymentAccount);
    const phoneResult = isValidPhoneNumber(data.UserPaymentAccount);
    const userNameResult = z
      .string()
      .regex(/^[\w-]{3,20}$/)
      .safeParse(data.UserPaymentAccount);

    if (data.UserPaymentType === "Zelle") {
      if (!(emailResult.success || phoneResult)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter your account phone number or email address",
          path: ["UserPaymentAccount"],
        });
      }
    } else if (!(emailResult.success || phoneResult || userNameResult.success)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please enter your account username, phone number or email address",
        path: ["UserPaymentAccount"],
      });
    }
  });

  export const emailPreviewSchema = z.object({
    body: z.string().trim(),
    emailFormat: z.enum(AdminEmailFormat),
    emailType: z.enum(AdminEmailType),
    preview: z.string().trim(),
    subject: z.string().trim(),
    userFirstName: z.string().trim(),
  });

  export const finishRegistrationSchema = z
    .object({
      UserEmail: z.string().email(),
      UserFirstName: z.string().trim().min(2, "Please enter your first name"),
      UserLastName: z.string().trim().min(2, "Please enter your surname"),
      UserName: z.string().trim().min(2),
      UserPaymentAccount: z.string().trim().min(2, "Payment account is required"),
      UserPaymentType: z.enum(PaymentMethod, {
        message: "Please select an account type",
      }),
      UserPlaysSurvivor: z.boolean(),
      UserReferredByRaw: z
        .string()
        .trim()
        .regex(/\w{2,}\s\w{2,}/, "Please input the full name of the person that invited you"),
      UserTeamName: z.string().trim(),
    })
    .superRefine((data, ctx) => {
      const emailResult = z.string().email().safeParse(data.UserPaymentAccount);
      const phoneResult = isValidPhoneNumber(data.UserPaymentAccount);
      const userNameResult = z
        .string()
        .regex(/^[\w-]{3,20}$/)
        .safeParse(data.UserPaymentAccount);

      if (data.UserPaymentType === "Zelle") {
        if (!(emailResult.success || phoneResult)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please enter your account phone number or email address",
            path: ["UserPaymentAccount"],
          });
        }
      } else if (!(emailResult.success || phoneResult || userNameResult.success)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter your account username, phone number or email address",
          path: ["UserPaymentAccount"],
        });
      }
    });

export const loginSchema = z
  .object({
    confirmPassword: z.string().optional(),
    email: z.string().email(),
    isLogin: z.boolean(),
    password: z.string().min(6),
  })
  .superRefine((data, ctx) => {
    if (!data.isLogin) {
      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Passwords do not match",
          path: ["confirmPassword"],
        });
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Passwords do not match",
          path: ["password"],
        });
      }
    }
  });

  export const makeSurvivorPickSchema = z.object({
    gameID: gameIdSchema,
    teamID: teamIdSchema.nullable(),
    week: weekSchema,
  });

  export const restoreBackupSchema = z.object({
    backupName: z.string().min(5),
  });

  export const sendAdminEmailSchema = z.object({
    body: z.string(),
    emailType: z.enum(AdminEmailType),
    preview: z.string(),
    sendTo: z.enum(AdminEmailTo),
    subject: z.string(),
    userEmail: z.string().email().nullable(),
    userFirstName: z.string().trim().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.sendTo === 'New' && (!data.userEmail || !data.userFirstName)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please enter a user email and first name",
        path: ["userEmail"],
      });
    }

    if (data.emailType === 'Custom' && (!data.subject || !data.preview || !data.body)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please enter a subject, preview, and body",
        path: ["subject"],
      });
    }
  });

  export const updateMyTiebreakerScoreSchema = z.object({
    score: z.number().int().min(2),
    week: weekSchema,
  });

  export const validateMyPicksSchema = z.object({
    lastScore: z.number().int().nonnegative(),
    unused: z.array(z.number().int().min(1).max(16)),
    week: weekSchema,
  });
