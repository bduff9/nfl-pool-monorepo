"use server";

import "server-only";

import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { updateAllPayouts } from "@nfl-pool-monorepo/db/src/mutations/payment";
import { getCurrentWeekInProgress } from "@nfl-pool-monorepo/db/src/queries/game";
import { sendPrizesSetEmail } from "@nfl-pool-monorepo/transactional/emails/prizesSet";
import { revalidatePath } from "next/cache";

import { adminActionClient } from "@/lib/safe-action";
import { payoutsSchema, serverActionResultSchema } from "@/lib/validation";

export const updatePayouts = adminActionClient
  .inputSchema(payoutsSchema)
  .outputSchema(serverActionResultSchema)
  .action(async ({ parsedInput }) => {
    const {
      overall1stPrize,
      overall2ndPrize,
      overall3rdPrize,
      survivor1stPrize,
      survivor2ndPrize,
      weekly1stPrize,
      weekly2ndPrize,
    } = parsedInput;
    const weeklyPrizes = JSON.stringify([0, weekly1stPrize, weekly2ndPrize]);
    const overallPrizes = JSON.stringify([0, overall1stPrize, overall2ndPrize, overall3rdPrize]);
    const survivorPrizes = JSON.stringify([0, survivor1stPrize, survivor2ndPrize]);

    try {
      await db.transaction().execute(async (trx) => {
        await trx
          .updateTable("SystemValues")
          .set({ SystemValueValue: weeklyPrizes })
          .where("SystemValueName", "=", "WeeklyPrizes")
          .executeTakeFirstOrThrow();
        await trx
          .updateTable("SystemValues")
          .set({ SystemValueValue: overallPrizes })
          .where("SystemValueName", "=", "OverallPrizes")
          .executeTakeFirstOrThrow();
        await trx
          .updateTable("SystemValues")
          .set({ SystemValueValue: survivorPrizes })
          .where("SystemValueName", "=", "SurvivorPrizes")
          .executeTakeFirstOrThrow();

        const week = await getCurrentWeekInProgress();

        await updateAllPayouts(week ?? 1, trx);
      });
    } catch (error) {
      console.error("Failed to save payouts", error, parsedInput);

      if (error instanceof Error) {
        throw error;
      }

      throw new Error("Failed to save payouts");
    }

    const users = await db
      .selectFrom("Users")
      .select(["UserEmail", "UserFirstName"])
      .where("UserDoneRegistering", "=", 1)
      .where("UserCommunicationsOptedOut", "=", 0)
      .execute();

    await Promise.all(
      users.map((user) =>
        sendPrizesSetEmail(
          user,
          overall1stPrize,
          overall2ndPrize,
          overall3rdPrize,
          survivor1stPrize,
          survivor2ndPrize,
          weekly1stPrize,
          weekly2ndPrize,
        ).catch((error) => {
          console.error("Failed to send email for prize amounts", user, error);
        }),
      ),
    );

    revalidatePath("/admin/payments");

    return {
      metadata: {},
      status: "Success",
    };
  });
