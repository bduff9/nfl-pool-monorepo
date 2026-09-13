"use server";

import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { manuallyUpdateGame } from "@nfl-pool-monorepo/db/src/mutations/game";
import { updateOverallMV } from "@nfl-pool-monorepo/db/src/mutations/overallMv";
import { updateSurvivorMV } from "@nfl-pool-monorepo/db/src/mutations/survivorMv";
import { updateWeeklyMV } from "@nfl-pool-monorepo/db/src/mutations/weeklyMv";
import { weekSchema } from "@nfl-pool-monorepo/utils/validation";
import { type } from "arktype";
import { revalidatePath, updateTag } from "next/cache";
import "server-only";

import { cacheTags } from "@/lib/cacheTags";
import { ActionError, adminActionClient } from "@/lib/safe-action";
import { serverActionResultSchema } from "@/lib/validation";

const adminGameUpdateSchema = type({
  gameID: type("number.integer > 0"),
  homeScore: type("number.integer >= 0"),
  status: type.enumerated(
    "Pregame",
    "1st Quarter",
    "2nd Quarter",
    "Half Time",
    "3rd Quarter",
    "4th Quarter",
    "Overtime",
    "Final",
    "Invalid",
  ),
  visitorScore: type("number.integer >= 0"),
});

export const adminUpdateGame = adminActionClient
  .inputSchema(adminGameUpdateSchema)
  .outputSchema(serverActionResultSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { gameID, homeScore, status, visitorScore } = parsedInput;

    const game = await db.selectFrom("Games").select(["GameWeek"]).where("GameID", "=", gameID).executeTakeFirst();

    if (!game) {
      throw new ActionError("Game not found");
    }

    const week = weekSchema(game.GameWeek);

    if (week instanceof type.errors) {
      throw new ActionError("Game has an invalid week");
    }

    try {
      await manuallyUpdateGame({
        gameID,
        homeScore,
        status,
        updatedBy: ctx.user.email,
        visitorScore,
      });
    } catch (error) {
      console.error("Failed to manually update game", { error, gameID });

      throw new ActionError("Failed to update game");
    }

    // Keep standings in sync with the override rather than waiting for the next cron pass.
    // Best-effort: the cron jobs re-run these every few minutes, so a refresh failure
    // here must not fail the override itself.
    try {
      await updateWeeklyMV(week);
      await updateOverallMV(week);
      await updateSurvivorMV(week);
    } catch (error) {
      console.error("Game updated, but MV refresh failed (cron will converge)", { error, gameID, week });
    }

    revalidatePath("/admin/games");
    revalidatePath("/scoreboard");
    revalidatePath("/picks/view");
    updateTag(cacheTags.gamesWeek(week));
    updateTag(cacheTags.overallMv());
    updateTag(cacheTags.weeklyMv(week));

    return {
      metadata: {},
      status: "Success",
    };
  });
