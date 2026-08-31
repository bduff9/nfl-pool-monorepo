"use server";

import { revalidatePath, updateTag } from "next/cache";
import "server-only";

import { db } from "@nfl-pool-monorepo/db/src/kysely";

import { cacheTags } from "@/lib/cacheTags";
import { authActionClient } from "@/lib/safe-action";
import { serverActionResultSchema, updateMyTiebreakerScoreSchema } from "@/lib/validation";

export const updateMyTiebreakerScore = authActionClient
  .inputSchema(updateMyTiebreakerScoreSchema)
  .outputSchema(serverActionResultSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { week, score } = parsedInput;

    try {
      await db.transaction().execute(async (trx) => {
        const lastGame = await trx
          .selectFrom("Games")
          .select(["GameKickoff"])
          .where("GameWeek", "=", week)
          .orderBy("GameKickoff desc")
          .executeTakeFirstOrThrow();

        if (lastGame.GameKickoff < new Date()) {
          throw new Error("Game has already started!");
        }

        const myTiebreaker = await trx
          .selectFrom("Tiebreakers")
          .select(["TiebreakerID", "TiebreakerHasSubmitted"])
          .where("TiebreakerWeek", "=", week)
          .where("UserID", "=", ctx.user.id)
          .executeTakeFirstOrThrow();

        if (myTiebreaker.TiebreakerHasSubmitted) {
          throw new Error("Tiebreaker has already been submitted!");
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

      if (error instanceof Error) {
        throw error;
      }

      throw new Error("Failed to update my tiebreaker score");
    }

    revalidatePath("/picks/set");
    updateTag(cacheTags.weeklyMv(week));

    return {
      metadata: {},
      status: "Success",
    };
  });
