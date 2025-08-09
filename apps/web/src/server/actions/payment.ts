"use server";

import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { sql } from "kysely";
import { revalidatePath } from "next/cache";

import { serverActionResultSchema } from "@/lib/zod";
import { adminProcedure } from "@/lib/zsa.server";
import "server-only";

import { z } from "zod";
import { ZSAError } from "zsa";

export const insertUserPayout = adminProcedure
  .input(
    z.object({
      amount: z.number(),
      userID: z.number(),
    }),
  )
  .output(serverActionResultSchema)
  .handler(async ({ ctx, input }) => {
    const { userID, amount } = input;

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

export const updateUserPaid = adminProcedure
  .input(
    z.object({
      amountPaid: z.number().int(),
      userID: z.number().int(),
    }),
  )
  .output(serverActionResultSchema)
  .handler(async ({ ctx, input }) => {
    const { userID, amountPaid } = input;

    try {
      await db.transaction().execute(async (trx) => {
        const balanceResult = await trx
          .selectFrom("Payments")
          .select(({ ref }) => sql<number>`SUM(${ref("PaymentAmount")})`.as("balance"))
          .where("UserID", "=", userID)
          .executeTakeFirstOrThrow();
        const newOwed = balanceResult.balance + amountPaid;

        if (newOwed > 0) {
          throw new ZSAError("PRECONDITION_FAILED", "Amount paid is greater than owed, cancelling...");
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

      if (error instanceof ZSAError) {
        throw error;
      }

      throw new ZSAError("INTERNAL_SERVER_ERROR", "Failed to update user paid amount");
    }

    revalidatePath("/admin/users");

    return {
      metadata: {},
      status: "Success",
    };
  });
