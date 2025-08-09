"use server";

import { revalidatePath } from "next/cache";
import "server-only";

import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { ZSAError } from "zsa";

import { serverActionResultSchema, updateMyTiebreakerScoreSchema } from "@/lib/zod";
import { authedProcedure } from "@/lib/zsa.server";

export const updateMyTiebreakerScore = authedProcedure
  .input(updateMyTiebreakerScoreSchema)
  .output(serverActionResultSchema)
  .handler(async ({ ctx, input }) => {
    const { week, score } = input;

    try {
      await db.transaction().execute(async (trx) => {
        const lastGame = await trx
          .selectFrom("Games")
          .select(["GameKickoff"])
          .where("GameWeek", "=", week)
          .orderBy("GameKickoff desc")
          .executeTakeFirstOrThrow();

        if (lastGame.GameKickoff < new Date()) {
          throw new ZSAError("PRECONDITION_FAILED", "Game has already started!");
        }

        const myTiebreaker = await trx
          .selectFrom("Tiebreakers")
          .select(["TiebreakerID", "TiebreakerHasSubmitted"])
          .where("TiebreakerWeek", "=", week)
          .where("UserID", "=", ctx.user.id)
          .executeTakeFirstOrThrow();

        if (myTiebreaker.TiebreakerHasSubmitted) {
          throw new ZSAError("PRECONDITION_FAILED", "Tiebreaker has already been submitted!");
        }

        await trx
          .updateTable("Tiebreakers")
          .set({
            TiebreakerLastScore: score,
            TiebreakerUpdated: new Date(),
            TiebreakerUpdatedBy: ctx.user.email,
          })
          .where("TiebreakerID", "=", myTiebreaker.TiebreakerID)
          .executeTakeFirstOrThrow();
      });
    } catch (error) {
      console.error("Failed to update my tiebreaker score", week, error);

      if (error instanceof ZSAError) {
        throw error;
      }

      throw new ZSAError("INTERNAL_SERVER_ERROR", "Failed to update my tiebreaker score");
    }

    revalidatePath("/picks/set");

    return {
      metadata: {},
      status: "Success",
    };
  });
