"use server";

import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { sql } from "kysely";
import { revalidatePath } from "next/cache";

import { adminActionClient } from "@/lib/safe-action";
import { serverActionResultSchema } from "@/lib/validation";
import "server-only";

import { type } from "arktype";

export const insertUserPayout = adminActionClient
  .inputSchema(
    type({
      amount: "number",
      userID: "number",
    }),
  )
  .outputSchema(serverActionResultSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { userID, amount } = parsedInput;

    await db
      .insertInto("Payments")
      .values({
        PaymentAddedBy: ctx.user.email,
        PaymentAmount: amount * -1,
        PaymentDescription: "User Payout",
        PaymentType: "Payout",
        PaymentUpdatedBy: ctx.user.email,
        PaymentWeek: null,
        UserID: userID,
      })
      .executeTakeFirstOrThrow();

    return {
      metadata: {},
      status: "Success",
    };
  });

export const updateUserPaid = adminActionClient
  .inputSchema(
    type({
      amountPaid: "number.integer",
      userID: "number.integer",
    }),
  )
  .outputSchema(serverActionResultSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { userID, amountPaid } = parsedInput;

    try {
      await db.transaction().execute(async (trx) => {
        const balanceResult = await trx
          .selectFrom("Payments")
          .select(({ ref }) => sql<string>`SUM(${ref("PaymentAmount")})`.as("balance"))
          .where("UserID", "=", userID)
          .executeTakeFirstOrThrow();
        const newOwed = Number(balanceResult.balance) + amountPaid;

        if (newOwed > 0) {
          throw new Error("Amount paid is greater than owed, cancelling...");
        }

        await trx
          .insertInto("Payments")
          .values({
            PaymentAddedBy: ctx.user.email,
            PaymentAmount: amountPaid,
            PaymentDescription: "User Paid",
            PaymentType: "Paid",
            PaymentUpdatedBy: ctx.user.email,
            PaymentWeek: null,
            UserID: userID,
          })
          .executeTakeFirstOrThrow();

        const userToUpdate = await trx
          .selectFrom("Users")
          .select(["UserName", "UserDoneRegistering"])
          .where("UserID", "=", userID)
          .executeTakeFirstOrThrow();

        if (newOwed === 0 && userToUpdate.UserDoneRegistering !== 1) {
          await trx
            .updateTable("Users")
            .set({ UserDoneRegistering: 1 })
            .where("UserID", "=", userID)
            .executeTakeFirstOrThrow();
        }

        await trx
          .insertInto("Logs")
          .values({
            LogAction: "PAID",
            LogAddedBy: ctx.user.email,
            LogMessage: `${userToUpdate.UserName} has paid $${amountPaid}`,
            LogUpdatedBy: ctx.user.email,
            UserID: userID,
          })
          .executeTakeFirstOrThrow();
      });
    } catch (error) {
      console.error("Failed to update user paid amount", error);

      if (error instanceof Error) {
        throw error;
      }

      throw new Error("Failed to update user paid amount");
    }

    revalidatePath("/admin/users");

    return {
      metadata: {},
      status: "Success",
    };
  });
