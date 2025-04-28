import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { cache } from "react";

import { getCurrentSession } from "./sessions";

export const getCurrentUser = cache(async () => {
  const { user } = await getCurrentSession();

  if (!user) {
    throw new Error("Not logged in");
  }

  return db
    .selectFrom("Users")
    .select([
      "UserID",
      "UserEmail",
      "UserFirstName",
      "UserLastName",
      "UserName",
      "UserTeamName",
      "UserReferredByRaw",
      "UserPaymentType",
      "UserPaymentAccount",
      "UserPlaysSurvivor",
      "UserTrusted",
      "UserPhone",
      "UserAutoPicksLeft",
      "UserAutoPickStrategy",
    ])
    .where("UserID", "=", user.id)
    .executeTakeFirstOrThrow();
});

export const userHasGoogle = cache(async (userId: number): Promise<boolean> => {
  const result = await db
    .selectFrom("Accounts")
    .select("AccountID")
    .where("UserID", "=", userId)
    .where("AccountProviderID", "=", "google")
    .execute();

  return result.length > 0;
});
