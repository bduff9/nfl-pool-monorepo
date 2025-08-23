"use server";

import type { DB, Users } from "@nfl-pool-monorepo/db/src";
import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { ensureUserIsInPublicLeague } from "@nfl-pool-monorepo/db/src/mutations/leagues";
import { insertUserHistoryRecord } from "@nfl-pool-monorepo/db/src/mutations/userHistory";
import { populateUserData } from "@nfl-pool-monorepo/db/src/mutations/users";
import { getPoolCost } from "@nfl-pool-monorepo/db/src/queries/systemValue";
import { sendNewUserEmail } from "@nfl-pool-monorepo/transactional/emails/newUser";
import { sendTrustedEmail } from "@nfl-pool-monorepo/transactional/emails/trusted";
import { sendUntrustedEmail } from "@nfl-pool-monorepo/transactional/emails/untrusted";
import { DEFAULT_AUTO_PICKS } from "@nfl-pool-monorepo/utils/constants";
import { type Selectable, sql, type Transaction } from "kysely";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import {
  createSession,
  generateSessionToken,
  hashPassword,
  mxExists,
  setSessionTokenCookie,
  verifyPasswordHash,
  verifyPasswordStrength,
} from "@/lib/auth";
import { editProfileSchema, finishRegistrationSchema, loginSchema, serverActionResultSchema } from "@/lib/zod";
import { adminProcedure, authedProcedure } from "@/lib/zsa.server";
import "server-only";

import { z } from "zod";
import { createServerAction, ZSAError } from "zsa";

import { updateUserNotifications } from "./notification";

export const editMyProfile = authedProcedure
  .input(editProfileSchema)
  .output(serverActionResultSchema)
  .handler(async ({ ctx, input }) => {
    const {
      notifications,
      UserAutoPickStrategy,
      UserAutoPicksLeft,
      UserEmail,
      UserFirstName,
      UserLastName,
      UserPaymentType,
      UserPaymentAccount,
      UserTeamName,
    } = input;

    await db.transaction().execute(async (trx) => {
      await trx
        .updateTable("Users")
        .set({
          UserAutoPickStrategy,
          UserAutoPicksLeft,
          UserEmail,
          UserFirstName,
          UserLastName,
          UserName: `${UserFirstName} ${UserLastName}`,
          UserPaymentAccount,
          UserPaymentType,
          UserTeamName,
        })
        .where("UserID", "=", ctx.user.id)
        .executeTakeFirstOrThrow();

      for (const notification of notifications) {
        await trx
          .updateTable("Notifications")
          .set({
            NotificationEmail: notification.NotificationEmail,
            NotificationEmailHoursBefore: notification.NotificationEmailHoursBefore,
            NotificationPushNotification: notification.NotificationPushNotification,
            NotificationPushNotificationHoursBefore: notification.NotificationPushNotificationHoursBefore,
            NotificationSMS: notification.NotificationSMS,
            NotificationSMSHoursBefore: notification.NotificationSMSHoursBefore,
            NotificationType: notification.NotificationType,
          })
          .where("NotificationID", "=", notification.NotificationID)
          .where("UserID", "=", ctx.user.id)
          .executeTakeFirstOrThrow();
      }
    });

    revalidatePath("/users/edit");

    return {
      metadata: {},
      status: "Success",
    };
  });

const registerUser = (
  trx: Transaction<DB>,
  user: Pick<
    Selectable<Users>,
    "UserID" | "UserEmail" | "UserPlaysSurvivor" | "UserTeamName" | "UserName" | "UserReferredByRaw"
  >,
): Promise<unknown> => {
  const promises: Promise<unknown>[] = [];

  promises.push(populateUserData(trx, user));
  promises.push(sendNewUserEmail(user));
  promises.push(ensureUserIsInPublicLeague(trx, user));
  promises.push(insertUserHistoryRecord(trx, user));
  promises.push(updateUserNotifications(trx, user));

  return Promise.allSettled(promises);
};

export const finishRegistration = authedProcedure
  .input(finishRegistrationSchema)
  .output(serverActionResultSchema)
  .handler(async ({ ctx, input }) => {
    if (ctx.user.doneRegistering === 1) {
      throw new ZSAError("FORBIDDEN", "User has already finished registration");
    }

    const user = await db
      .selectFrom("Users")
      .select(["UserEmail", "UserTrusted"])
      .where("UserID", "=", ctx.user.id)
      .executeTakeFirst();

    if (!user) {
      throw new ZSAError("FORBIDDEN", "User not found");
    }

    if (user.UserTrusted === 0) {
      throw new ZSAError("FORBIDDEN", "User has been blocked");
    }

    let isTrusted = user.UserTrusted === 1;

    try {
      await db.transaction().execute(async (trx) => {
        let doneRegistering = false;

        if (user.UserTrusted === null) {
          const referredByUser = await trx
            .selectFrom("Users")
            .select("UserID")
            .where("UserID", "<>", ctx.user.id)
            .where("UserName", "=", input.UserReferredByRaw)
            .where("UserTrusted", "=", 1)
            .executeTakeFirst();

          if (referredByUser) {
            await trx
              .updateTable("Users")
              .set({
                UserDoneRegistering: 1,
                UserReferredBy: referredByUser.UserID,
                UserTrusted: 1,
              })
              .where("UserID", "=", ctx.user.id)
              .executeTakeFirstOrThrow();
            doneRegistering = true;
            isTrusted = true;
          } else {
            await sendUntrustedEmail(input);
            isTrusted = false;
          }
        } else {
          await trx
            .updateTable("Users")
            .set({ UserDoneRegistering: 1 })
            .where("UserID", "=", ctx.user.id)
            .executeTakeFirstOrThrow();
          doneRegistering = true;
        }

        if (doneRegistering) {
          await registerUser(trx, {
            ...input,
            UserID: ctx.user.id,
            UserPlaysSurvivor: input.UserPlaysSurvivor ? 1 : 0,
          });
        }

        const {
          UserFirstName,
          UserLastName,
          UserName,
          UserTeamName,
          UserReferredByRaw,
          UserPaymentType,
          UserPaymentAccount,
          UserPlaysSurvivor,
        } = input;

        await trx
          .updateTable("Users")
          .set({
            UserAutoPicksLeft: DEFAULT_AUTO_PICKS,
            UserDoneRegistering: doneRegistering ? 1 : 0,
            UserFirstName,
            UserLastName,
            UserName,
            UserPaymentAccount,
            UserPaymentType,
            UserPlaysSurvivor: UserPlaysSurvivor ? 1 : 0,
            UserReferredByRaw,
            UserTeamName,
          })
          .where("UserID", "=", ctx.user.id)
          .executeTakeFirstOrThrow();

        const poolCost = await getPoolCost();

        await trx
          .insertInto("Payments")
          .values({
            PaymentAddedBy: user.UserEmail,
            PaymentAmount: -1 * poolCost,
            PaymentDescription: "Confidence Pool Entry Fee",
            PaymentType: "Fee",
            PaymentUpdatedBy: user.UserEmail,
            PaymentWeek: null,
            UserID: ctx.user.id,
          })
          .executeTakeFirstOrThrow();

        await trx
          .insertInto("Logs")
          .values({
            LogAction: "REGISTER",
            LogAddedBy: user.UserEmail,
            LogMessage: `${input.UserName} has finished registration`,
            LogUpdatedBy: user.UserEmail,
            UserID: ctx.user.id,
          })
          .executeTakeFirstOrThrow();
      });
    } catch (error) {
      console.error("Failed to register user", error);

      throw new ZSAError("ERROR", "Failed to register user");
    }

    revalidatePath("/users/create");

    return {
      metadata: {
        isTrusted,
      },
      status: "Success",
    };
  });

export const getUserDropdown = adminProcedure
  .output(
    z.array(
      z.object({
        UserID: z.number(),
        UserName: z.string().nullable(),
      }),
    ),
  )
  .handler(async () => {
    return db
      .selectFrom("Users")
      .select(["UserID", "UserName"])
      .where("UserTrusted", "=", 1)
      .orderBy("UserName", "asc")
      .execute();
  });

export const login = createServerAction()
  .input(loginSchema)
  .output(serverActionResultSchema)
  .handler(async ({ input }) => {
    const { email, password } = input;

    const user = await db
      .selectFrom("Users")
      .select(["UserID", "UserPasswordHash", "UserDoneRegistering", "UserTrusted"])
      .where("UserEmail", "=", email)
      .executeTakeFirst();

    if (!user) {
      throw new ZSAError("FORBIDDEN", "Invalid email or password");
    }

    if (!user.UserPasswordHash) {
      throw new ZSAError("FORBIDDEN", "Please use the 'Register here' button to set up your account");
    }

    const isPasswordValid = await verifyPasswordHash(user.UserPasswordHash, password);

    if (!isPasswordValid) {
      throw new ZSAError("FORBIDDEN", "Invalid email or password");
    }

    if (user.UserTrusted === 0) {
      throw new ZSAError(
        "FORBIDDEN",
        "Your account has been blocked.  Please reach out to an administrator to resolve.",
      );
    }

    if (!user.UserDoneRegistering) {
      const systemValueResult = await db
        .selectFrom("SystemValues")
        .select(["SystemValueValue"])
        .where("SystemValueName", "=", "PaymentDueWeek")
        .executeTakeFirst();

      if (!systemValueResult) {
        throw new ZSAError("FORBIDDEN", "System error, please contact an administrator");
      }

      const lastWeekToRegister = Number(systemValueResult.SystemValueValue);

      const currentWeekResult = await db
        .selectFrom("Games")
        .select(({ ref }) => [sql<string>`COALESCE(MIN(${ref("GameWeek")}), 18)`.as("GameWeek")])
        .where("GameStatus", "<>", "Final")
        .executeTakeFirstOrThrow();
      const currentWeek = Number(currentWeekResult.GameWeek);
      const owesResult = await db
        .selectFrom("Payments")
        .select(({ ref }) => [sql<number>`COALESCE(SUM(${ref("PaymentAmount")}), 0)`.as("owes")])
        .where("UserID", "=", user.UserID)
        .executeTakeFirstOrThrow();

      if (currentWeek > lastWeekToRegister) {
        if (owesResult.owes !== 0) {
          throw new ZSAError(
            "FORBIDDEN",
            "Your entry fee is past due, please pay immediately to regain access and avoid losing any points",
          );
        }

        throw new ZSAError("FORBIDDEN", "Sorry, registration is over for this year, please try again next season!");
      }
    }

    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, user.UserID);

    setSessionTokenCookie(sessionToken, session.expiresAt);

    const redirectTo = (await cookies()).get("redirect_to")?.value ?? "";

    return {
      metadata: { redirectTo },
      status: "Success",
    };
  });

export const markUserAsTrusted = adminProcedure
  .input(z.object({ referredByUserId: z.number(), userId: z.number() }))
  .output(serverActionResultSchema)
  .handler(async ({ ctx, input }) => {
    const { userId, referredByUserId } = input;

    if (userId === referredByUserId) {
      throw new ZSAError("PRECONDITION_FAILED", "User cannot refer themselves");
    }

    try {
      await db.transaction().execute(async (trx) => {
        const user = await trx
          .selectFrom("Users")
          .select([
            "UserID",
            "UserEmail",
            "UserName",
            "UserFirstName",
            "UserPlaysSurvivor",
            "UserReferredByRaw",
            "UserTeamName",
            "UserTrusted",
            "UserReferredBy",
          ])
          .where("UserID", "=", userId)
          .executeTakeFirstOrThrow();

        if (user.UserTrusted === 1 || user.UserReferredBy !== null) {
          throw new ZSAError("PRECONDITION_FAILED", "User is already trusted");
        }

        await trx
          .updateTable("Users")
          .set({
            UserDoneRegistering: 1,
            UserReferredBy: referredByUserId,
            UserTrusted: 1,
            UserUpdated: new Date(),
            UserUpdatedBy: ctx.user.email,
          })
          .where("UserID", "=", userId)
          .executeTakeFirstOrThrow();
        await registerUser(trx, user);
        await sendTrustedEmail(user);
      });
    } catch (error) {
      console.error("Failed to mark user as trusted", error);

      if (error instanceof ZSAError) {
        throw error;
      }

      throw new ZSAError("INTERNAL_SERVER_ERROR", "Failed to mark user as trusted");
    }

    revalidatePath("/admin/users");

    return {
      metadata: {},
      status: "Success",
    };
  });

export const register = createServerAction()
  .input(loginSchema)
  .output(serverActionResultSchema)
  .handler(async ({ input }) => {
    const { email, password } = input;

    let user = await db
      .selectFrom("Users")
      .select(["UserID", "UserPasswordHash", "UserDoneRegistering", "UserTrusted"])
      .where("UserEmail", "=", email)
      .executeTakeFirst();

    if (user) {
      if (user.UserPasswordHash) {
        throw new ZSAError("FORBIDDEN", "User already exists, please login");
      }

      if (user.UserTrusted === 0) {
        throw new ZSAError(
          "FORBIDDEN",
          "Your account has been blocked.  Please reach out to an administrator to resolve.",
        );
      }

      const isStrongPassword = await verifyPasswordStrength(password);

      if (!isStrongPassword) {
        throw new ZSAError(
          "FORBIDDEN",
          "Passwords must be at least 8 characters and should not be reused from other sites",
        );
      }

      const hashedPassword = await hashPassword(password);

      await db
        .updateTable("Users")
        .set({ UserPasswordHash: hashedPassword })
        .where("UserID", "=", user.UserID)
        .executeTakeFirstOrThrow();
    } else {
      const isValidMx = await mxExists(email);

      if (!isValidMx) {
        throw new ZSAError("FORBIDDEN", "It looks like your email is not valid, please double check it and try again");
      }

      const isStrongPassword = await verifyPasswordStrength(password);

      if (!isStrongPassword) {
        throw new ZSAError("FORBIDDEN", "Password is too weak");
      }

      const hashedPassword = await hashPassword(password);

      await db
        .insertInto("Users")
        .values({
          UserAddedBy: "ADMIN",
          UserEmail: email,
          UserPasswordHash: hashedPassword,
          UserUpdatedBy: "ADMIN",
        })
        .executeTakeFirstOrThrow();
      user = await db
        .selectFrom("Users")
        .select(["UserID", "UserDoneRegistering", "UserPasswordHash", "UserTrusted"])
        .where("UserEmail", "=", email)
        .executeTakeFirstOrThrow();
    }

    const systemValueResult = await db
      .selectFrom("SystemValues")
      .select(["SystemValueValue"])
      .where("SystemValueName", "=", "PaymentDueWeek")
      .executeTakeFirst();

    if (!systemValueResult) {
      throw new ZSAError("FORBIDDEN", "System error, please contact an administrator");
    }

    const lastWeekToRegister = Number(systemValueResult.SystemValueValue);
    const currentWeekResult = await db
      .selectFrom("Games")
      .select(({ ref }) => [sql<string>`COALESCE(MIN(${ref("GameWeek")}), 18)`.as("GameWeek")])
      .where("GameStatus", "<>", "Final")
      .executeTakeFirstOrThrow();
    const currentWeek = Number(currentWeekResult.GameWeek);

    if (currentWeek > lastWeekToRegister) {
      throw new ZSAError("FORBIDDEN", "Sorry, registration is over for this year, please try again next season!");
    }

    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, user.UserID);

    await setSessionTokenCookie(sessionToken, session.expiresAt);

    return {
      metadata: {},
      status: "Success",
    };
  });

export const removeUserFromAdmin = adminProcedure
  .input(
    z.object({
      userID: z.number(),
    }),
  )
  .output(serverActionResultSchema)
  .handler(async ({ input }) => {
    const { userID } = input;

    try {
      await db.transaction().execute(async (trx) => {
        const userToRemove = await trx
          .selectFrom("Users")
          .select(["UserEmail", "UserTrusted"])
          .where("UserID", "=", userID)
          .executeTakeFirstOrThrow();

        if (userToRemove.UserTrusted === 1) {
          throw new ZSAError("PRECONDITION_FAILED", "Cannot delete a trusted user");
        }

        await trx.deleteFrom("Users").where("UserID", "=", userID).executeTakeFirstOrThrow();
      });
    } catch (error) {
      console.error("Failed to remove user", error);

      if (error instanceof ZSAError) {
        throw error;
      }

      throw new ZSAError("INTERNAL_SERVER_ERROR", "Failed to remove user");
    }

    revalidatePath("/admin/users");

    return {
      metadata: {},
      status: "Success",
    };
  });
