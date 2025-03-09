"use server";

import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { sql } from "kysely";
import { cookies } from "next/headers";
import "server-only";
import { ZSAError, createServerAction } from "zsa";

import {
  createSession,
  generateSessionToken,
  hashPassword,
  mxExists,
  setSessionTokenCookie,
  verifyPasswordHash,
  verifyPasswordStrength,
} from "@/lib/auth";
import { loginSchema, serverActionResultSchema } from "@/lib/zod";

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

    if (!user?.UserPasswordHash) {
      throw new ZSAError("FORBIDDEN", "Please use the 'Register here' button to create an account");
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
      error: "",
      metadata: { redirectTo },
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
        throw new ZSAError("FORBIDDEN", "Password is too weak");
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

      user = await db
        .insertInto("Users")
        .values({ UserEmail: email, UserPasswordHash: hashedPassword, UserAddedBy: "ADMIN", UserUpdatedBy: "ADMIN" })
        .returning(["UserID", "UserPasswordHash", "UserDoneRegistering", "UserTrusted"])
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

    setSessionTokenCookie(sessionToken, session.expiresAt);

    return {
      error: "",
      metadata: {},
      status: "Success",
    };
  });
