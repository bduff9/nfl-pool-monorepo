"use server";

import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { registerUserForSurvivor, unregisterUserForSurvivor } from "@nfl-pool-monorepo/db/src/mutations/users";
import { sql } from "kysely";
import { revalidatePath } from "next/cache";

import { adminActionClient, authActionClient } from "@/lib/safe-action";
import { makeSurvivorPickSchema, serverActionResultSchema } from "@/lib/validation";
import "server-only";

import { type } from "arktype";

export const makeSurvivorPick = authActionClient
  .inputSchema(makeSurvivorPickSchema)
  .outputSchema(serverActionResultSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { gameID, teamID, week } = parsedInput;
    const mv = await db
      .selectFrom("SurvivorMV")
      .select("IsAliveOverall")
      .where("UserID", "=", ctx.user.id)
      .executeTakeFirst();

    if (ctx.user.playsSurvivor === 0 || mv?.IsAliveOverall === 0) {
      throw new Error("Cannot make pick, user is already out of survivor");
    }

    const gamesStarted = await db
      .selectFrom("Games")
      .select(sql<number>`COUNT(*)`.as("count"))
      .where("GameWeek", "=", week)
      .where("GameKickoff", "<", sql<Date>`CURRENT_TIMESTAMP`)
      .executeTakeFirstOrThrow();

    if (gamesStarted.count > 0) {
      throw new Error("Week has already started, no more survivor picks can be made");
    }

    const game = await db
      .selectFrom("Games")
      .select(["HomeTeamID", "VisitorTeamID"])
      .where("GameID", "=", gameID)
      .where("GameWeek", "=", week)
      .executeTakeFirstOrThrow();

    if (game.HomeTeamID !== teamID && game.VisitorTeamID !== teamID) {
      console.error("Invalid game and team sent for week", {
        input: parsedInput,
        user: ctx.user,
      });

      throw new Error("Invalid game and team in week sent");
    }

    try {
      await db.transaction().execute(async (trx) => {
        await trx
          .updateTable("SurvivorPicks")
          .set({
            GameID: gameID,
            SurvivorPickUpdated: new Date(),
            SurvivorPickUpdatedBy: ctx.user.email,
            TeamID: teamID,
          })
          .where("UserID", "=", ctx.user.id)
          .where("SurvivorPickWeek", "=", week)
          .executeTakeFirstOrThrow();

        await trx
          .insertInto("Logs")
          .values({
            LogAction: "SURVIVOR_PICK",
            LogAddedBy: ctx.user.email,
            LogMessage: `${ctx.user.name ?? ctx.user.email} made their survivor pick for week ${week}`,
            LogUpdated: new Date(),
            LogUpdatedBy: ctx.user.email,
            UserID: ctx.user.id,
          })
          .executeTakeFirstOrThrow();
      });
    } catch (error) {
      console.error(`Failed to make survivor pick for week ${week}`, error);

      if (error instanceof Error) {
        throw error;
      }

      throw new Error(`Failed to make survivor pick for week ${week}`);
    }

    revalidatePath("/survivor/set");

    return {
      metadata: {},
      status: "Success",
    };
  });

export const registerForSurvivor = authActionClient.outputSchema(serverActionResultSchema).action(async ({ ctx }) => {
  if (ctx.user.playsSurvivor) {
    throw new Error("Already registered for survivor");
  }

  try {
    await db.transaction().execute(async (trx) => {
      await registerUserForSurvivor(trx, ctx.user.id);
    });
  } catch (error) {
    console.error("Failed to register user for survivor", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to register user for survivor");
  }

  revalidatePath("/", "layout");

  return {
    metadata: {},
    status: "Success",
  };
});

export const toggleUserSurvivor = adminActionClient
  .inputSchema(
    type({
      playsSurvivor: "0 <= number.integer <= 1",
      userID: "number.integer",
    }),
  )
  .outputSchema(serverActionResultSchema)
  .action(async ({ parsedInput }) => {
    const { userID, playsSurvivor } = parsedInput;

    try {
      await db.transaction().execute(async (trx) => {
        if (playsSurvivor === 1) {
          await registerUserForSurvivor(trx, userID);
        } else {
          await unregisterUserForSurvivor(trx, userID);
        }
      });
    } catch (error) {
      console.error("Failed to toggle user survivor", error);

      if (error instanceof Error) {
        throw error;
      }

      throw new Error("Failed to toggle user survivor");
    }

    revalidatePath("/admin/users");

    return {
      metadata: {},
      status: "Success",
    };
  });

export const unregisterForSurvivor = authActionClient.outputSchema(serverActionResultSchema).action(async ({ ctx }) => {
  if (!ctx.user.playsSurvivor) {
    throw new Error("Not registered for survivor");
  }

  try {
    await db.transaction().execute(async (trx) => {
      await unregisterUserForSurvivor(trx, ctx.user.id);
    });
  } catch (error) {
    console.error("Failed to unregister user for survivor", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to unregister user for survivor");
  }

  revalidatePath("/", "layout");

  return {
    metadata: {},
    status: "Success",
  };
});
