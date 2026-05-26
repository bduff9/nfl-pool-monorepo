import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { sql } from "kysely";

import "server-only";

export class AuthVerificationError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "AuthVerificationError";
    this.statusCode = statusCode;
  }
}

const getRegistrationDeadlineInfo = async () => {
  const systemValueResult = await db
    .selectFrom("SystemValues")
    .select(["SystemValueValue"])
    .where("SystemValueName", "=", "PaymentDueWeek")
    .executeTakeFirst();

  if (!systemValueResult) {
    throw new AuthVerificationError("System error, please contact an administrator", 500);
  }

  const lastWeekToRegister = Number(systemValueResult.SystemValueValue);

  const currentWeekResult = await db
    .selectFrom("Games")
    .select(({ ref }) => [sql<string>`COALESCE(MIN(${ref("GameWeek")}), 18)`.as("GameWeek")])
    .where("GameStatus", "<>", "Final")
    .executeTakeFirstOrThrow();
  const currentWeek = Number(currentWeekResult.GameWeek);

  return { currentWeek, lastWeekToRegister };
};

/**
 * Verifies that a user is allowed to log in based on trust status and registration deadline.
 * Extracted from the `login` server action for reuse in OAuth flows.
 */
export const verifyLoginEligibility = async (user: {
  UserID: number;
  UserDoneRegistering: number | null;
  UserTrusted: number | null;
}): Promise<void> => {
  if (user.UserTrusted === 0) {
    throw new AuthVerificationError(
      "Your account has been blocked.  Please reach out to an administrator to resolve.",
      403,
    );
  }

  if (user.UserDoneRegistering !== 1) {
    const { currentWeek, lastWeekToRegister } = await getRegistrationDeadlineInfo();

    if (currentWeek > lastWeekToRegister) {
      const owesResult = await db
        .selectFrom("Payments")
        .select(({ ref }) => [sql<string>`COALESCE(SUM(${ref("PaymentAmount")}), 0)`.as("owes")])
        .where("UserID", "=", user.UserID)
        .executeTakeFirstOrThrow();

      if (Number(owesResult.owes) !== 0) {
        throw new AuthVerificationError(
          "Your entry fee is past due, please pay immediately to regain access and avoid losing any points",
          403,
        );
      }

      throw new AuthVerificationError("Sorry, registration is over for this year, please try again next season!", 403);
    }
  }
};

/**
 * Verifies that a new user is allowed to register based on the registration deadline.
 * Extracted from the `register` server action for reuse in OAuth flows.
 */
export const verifyRegistrationEligibility = async (): Promise<void> => {
  const { currentWeek, lastWeekToRegister } = await getRegistrationDeadlineInfo();

  if (currentWeek > lastWeekToRegister) {
    throw new AuthVerificationError("Sorry, registration is over for this year, please try again next season!", 403);
  }
};
