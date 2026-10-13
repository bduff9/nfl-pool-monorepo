"use server";

import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { updateOverallMV } from "@nfl-pool-monorepo/db/src/mutations/overallMv";
import { updateAllPayouts } from "@nfl-pool-monorepo/db/src/mutations/payment";
import { updateSurvivorMV } from "@nfl-pool-monorepo/db/src/mutations/survivorMv";
import { canDeregister } from "@nfl-pool-monorepo/db/src/mutations/userHelpers";
import { removeUserFromSeason } from "@nfl-pool-monorepo/db/src/mutations/users";
import { updateWeeklyMV } from "@nfl-pool-monorepo/db/src/mutations/weeklyMv";
import { getCurrentWeek } from "@nfl-pool-monorepo/db/src/queries/week";
import { sql } from "kysely";
import { revalidatePath, updateTag } from "next/cache";

import { cacheTags } from "@/lib/cacheTags";
import { ActionError, adminActionClient } from "@/lib/safe-action";
import { serverActionResultSchema } from "@/lib/validation";
import "server-only";

import { type } from "arktype";

const rebuildStandings = async (week: number): Promise<void> => {
  for (let i = 1; i <= week; i++) {
    // react-doctor-disable-next-line async-await-in-loop -- the MV refreshes lock tables and run under one advisory lock, so they must run one at a time
    await updateWeeklyMV(i);
  }

  await updateOverallMV(week);
  await updateSurvivorMV(week);
  await updateAllPayouts(week);
};

const expireStandingsCaches = (week: number): void => {
  for (let i = 1; i <= week; i++) {
    updateTag(cacheTags.weeklyMv(i));
  }

  updateTag(cacheTags.overallMv());
  revalidatePath("/admin/users");
};

// The payment lockout marks unpaid users unregistered but leaves their picks and standings rows, so eligibility is
// "still has entries this season", not the registered flag
const getDeregistrableUserName = async (userID: number, adminID: number): Promise<string> => {
  if (userID === adminID) {
    throw new ActionError("You cannot deregister yourself");
  }

  const user = await db
    .selectFrom("Users as u")
    .select(({ selectFrom }) => [
      "u.UserName",
      sql<number>`exists(${selectFrom("Picks as p").select("p.PickID").whereRef("p.UserID", "=", "u.UserID")})`.as(
        "hasEntries",
      ),
    ])
    .where("u.UserID", "=", userID)
    .executeTakeFirst();

  if (!user?.hasEntries) {
    throw new ActionError("User has no entries this season");
  }

  return user.UserName ?? `User ${userID}`;
};

const deregisterInTransaction = async (userID: number, userName: string, adminEmail: string): Promise<void> => {
  await db.transaction().execute(async (trx) => {
    const payments = await trx.selectFrom("Payments").select("PaymentType").where("UserID", "=", userID).execute();

    if (!canDeregister(payments)) {
      throw new ActionError("User has a payment on record and cannot be deregistered");
    }

    await removeUserFromSeason(trx, userID, adminEmail);
    await trx
      .insertInto("Logs")
      .values({
        LogAction: "REGISTER",
        LogAddedBy: adminEmail,
        LogMessage: `${userName} was deregistered from the season by ${adminEmail}`,
        LogUpdatedBy: adminEmail,
        UserID: userID,
      })
      .executeTakeFirstOrThrow();
  });
};

export const deregisterUser = adminActionClient
  .inputSchema(type({ userID: "number.integer" }))
  .outputSchema(serverActionResultSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { userID } = parsedInput;
    const userName = await getDeregistrableUserName(userID, ctx.user.id);

    await deregisterInTransaction(userID, userName, ctx.user.email);

    const week = await getCurrentWeek();

    try {
      await rebuildStandings(week);
    } catch (error) {
      // The user's standings rows are already gone; the live updater re-ranks everyone on the next game update.
      console.error("User deregistered, but standings rebuild failed (cron will converge)", { error, userID, week });
    }

    expireStandingsCaches(week);

    return {
      metadata: {},
      status: "Success",
    };
  });
