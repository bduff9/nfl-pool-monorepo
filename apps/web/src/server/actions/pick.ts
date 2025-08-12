"use server";

import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { sendPicksSubmittedEmail } from "@nfl-pool-monorepo/transactional/emails/picksSubmitted";
import { sendQuickPickConfirmationEmail } from "@nfl-pool-monorepo/transactional/emails/quickPickConfirmation";
import sendPicksSubmittedPushNotification from "@nfl-pool-monorepo/transactional/pushNotifications/picksSubmitted";
import sendPicksSubmittedSMS from "@nfl-pool-monorepo/transactional/sms/picksSubmitted";
import { sql } from "kysely";
import { revalidatePath } from "next/cache";
import "server-only";

import { getLowestUnusedPoint } from "@nfl-pool-monorepo/db/src/queries/pick";
import { weekSchema } from "@nfl-pool-monorepo/utils/zod";
import { z } from "zod";
import { createServerAction, ZSAError } from "zsa";

import type { AutoPickStrategy } from "@/lib/constants";
import { autoPickSchema, serverActionResultSchema, setMyPickSchema, validateMyPicksSchema } from "@/lib/zod";
import { authedProcedure } from "@/lib/zsa.server";

import { getCurrentSession } from "../loaders/sessions";

const shouldAutoPickHome = (type: (typeof AutoPickStrategy)[number]): boolean => {
  if (type === "Home") return true;

  if (type === "Away") return false;

  return !!Math.round(Math.random());
};

export const autoPickMyPicks = authedProcedure
  .input(autoPickSchema)
  .output(serverActionResultSchema)
  .handler(async ({ ctx, input }) => {
    const { week, type } = input;

    try {
      await db.transaction().execute(async (trx) => {
        const picksForWeek = await trx
          .selectFrom("Picks as P")
          .select(["P.PickID", "P.PickPoints"])
          .innerJoin("Games as G", "G.GameID", "P.GameID")
          .select(["G.GameKickoff", "G.HomeTeamID", "G.VisitorTeamID"])
          .where("G.GameWeek", "=", week)
          .where("P.UserID", "=", ctx.user.id)
          .execute();
        const usedPoints = picksForWeek
          .filter(({ PickPoints }) => PickPoints !== null)
          .map(({ PickPoints }) => PickPoints as number);
        const availablePoints = picksForWeek
          .map((_, i) => {
            const point = i + 1;

            if (usedPoints.includes(point)) return null;

            return point;
          })
          .filter((point): point is number => point !== null);
        const unmadePicks = picksForWeek.filter((pick) => {
          if (pick.PickPoints) return false;

          const hasStarted = pick.GameKickoff < new Date();

          if (hasStarted) return false;

          return true;
        });

        for (const pick of unmadePicks) {
          const pointIndex = Math.floor(Math.random() * availablePoints.length);
          const PickPoints = availablePoints.splice(pointIndex, 1)[0];
          const PickUpdated = new Date();
          const PickUpdatedBy = ctx.user.email ?? undefined;
          let TeamID: number;

          if (shouldAutoPickHome(type)) {
            TeamID = pick.HomeTeamID;
          } else {
            TeamID = pick.VisitorTeamID;
          }

          await trx
            .updateTable("Picks")
            .set({ PickPoints, PickUpdated, PickUpdatedBy, TeamID })
            .where("PickID", "=", pick.PickID)
            .executeTakeFirstOrThrow();
        }
      });
    } catch (error) {
      console.error("Failed to auto pick for week", type, week, error);

      if (error instanceof ZSAError) {
        throw error;
      }

      throw new ZSAError("INTERNAL_SERVER_ERROR", "Failed to auto pick for week");
    }

    revalidatePath("/picks/set");

    return {
      metadata: {},
      status: "Success",
    };
  });

export const quickPick = createServerAction()
  .input(
    z.object({
      teamId: z.coerce.number().int().positive().max(33),
      userId: z.coerce.number().int().positive(),
    }),
  )
  .output(serverActionResultSchema)
  .handler(async ({ input }) => {
    const { user } = await getCurrentSession();
    const givenUserID = user?.id;
    const { teamId, userId } = input;

    if (givenUserID && givenUserID !== userId) {
      console.error("Passed user ID does not match context", { teamId, user, userId });

      return {
        metadata: {},
        status: "Success",
      };
    }

    const game = await db
      .selectFrom("Games")
      .select(["GameID", "GameWeek"])
      .where("GameNumber", "=", 1)
      .where("GameKickoff", ">", sql<Date>`CURRENT_TIMESTAMP`)
      .where((eb) => sql<number>`YEARWEEK(${eb.ref("GameKickoff")})`, "=", sql<number>`YEARWEEK(CURRENT_TIMESTAMP)`)
      .where((eb) => eb.or([eb("HomeTeamID", "=", teamId), eb("VisitorTeamID", "=", teamId)]))
      .executeTakeFirst();

    if (!game) {
      console.error("No matching game found", { teamId, user, userId });

      throw new ZSAError("NOT_FOUND", "No matching game found");
    }

    const pick = await db
      .selectFrom("Picks")
      .select(["PickID", "PickPoints", "TeamID", "UserID"])
      .where("GameID", "=", game.GameID)
      .where("UserID", "=", userId)
      .executeTakeFirstOrThrow();

    if (pick.TeamID || pick.PickPoints) {
      console.error("Pick has already been made", { game, pick, teamId, user, userId });

      throw new ZSAError("PRECONDITION_FAILED", "Pick has already been made");
    }

    const lowestPoint = await getLowestUnusedPoint(game.GameWeek, userId);

    if (lowestPoint === null) {
      console.error("Quick pick failed because user has not made this pick but also has no points left to use", {
        game,
        pick,
        teamId,
        userId,
      });

      throw new ZSAError(
        "INTERNAL_SERVER_ERROR",
        "Quick pick failed because you have not made this pick but also you have no points left to use",
      );
    }

    await db
      .updateTable("Picks")
      .set({
        PickPoints: lowestPoint,
        PickUpdated: new Date(),
        PickUpdatedBy: user?.email,
        TeamID: teamId,
      })
      .where("PickID", "=", pick.PickID)
      .executeTakeFirstOrThrow();
    await sendQuickPickConfirmationEmail(userId, teamId, lowestPoint, game.GameWeek);

    return {
      metadata: {},
      status: "Success",
    };
  });

export const resetMyPicksForWeek = authedProcedure
  .input(z.object({ week: weekSchema }))
  .output(serverActionResultSchema)
  .handler(async ({ ctx, input }) => {
    const { week } = input;

    try {
      await db.transaction().execute(async (trx) => {
        await trx
          .updateTable("Picks")
          .set({
            PickPoints: null,
            PickUpdated: new Date(),
            PickUpdatedBy: ctx.user.email,
            TeamID: null,
          })
          .where("UserID", "=", ctx.user.id)
          .where(({ eb, selectFrom }) =>
            eb(
              "GameID",
              "in",
              selectFrom("Games")
                .select("GameID")
                .where("GameWeek", "=", week)
                .where("GameKickoff", ">", sql<Date>`CURRENT_TIMESTAMP`),
            ),
          )
          .executeTakeFirstOrThrow();
      });
    } catch (error) {
      console.error("Failed to reset picks for week", week, error);

      if (error instanceof ZSAError) {
        throw error;
      }

      throw new ZSAError("INTERNAL_SERVER_ERROR", "Failed to reset picks for week");
    }

    revalidatePath("/picks/set");

    return {
      metadata: {},
      status: "Success",
    };
  });

export const setMyPick = authedProcedure
  .input(setMyPickSchema)
  .output(serverActionResultSchema)
  .handler(async ({ ctx, input }) => {
    const { gameID, points, teamID, week } = input;

    try {
      await db.transaction().execute(async (trx) => {
        const oldPick = await trx
          .selectFrom("Picks as P")
          .selectAll("P")
          .innerJoin("Games as G", "G.GameID", "P.GameID")
          .selectAll("G")
          .where("G.GameWeek", "=", week)
          .where("P.UserID", "=", ctx.user.id)
          .where("P.PickPoints", "=", points)
          .executeTakeFirst();

        if (oldPick) {
          const hasStarted = oldPick.GameKickoff < new Date();

          if (hasStarted) {
            throw new ZSAError("PRECONDITION_FAILED", "Game has already started!");
          }

          await trx
            .updateTable("Picks")
            .set({
              PickPoints: null,
              PickUpdated: new Date(),
              PickUpdatedBy: ctx.user.email,
              TeamID: null,
            })
            .where("PickID", "=", oldPick.PickID)
            .execute();
        }

        if (gameID) {
          const newPick = await trx
            .selectFrom("Picks as P")
            .selectAll("P")
            .innerJoin("Games as G", "G.GameID", "P.GameID")
            .selectAll("G")
            .where("P.GameID", "=", gameID)
            .where("G.GameWeek", "=", week)
            .where("G.GameKickoff", ">", sql<Date>`CURRENT_TIMESTAMP`)
            .where("P.UserID", "=", ctx.user.id)
            .executeTakeFirst();

          if (!newPick) {
            throw new ZSAError("PRECONDITION_FAILED", "No pick found that can be changed!");
          }

          if (newPick.HomeTeamID !== teamID && newPick.VisitorTeamID !== teamID) {
            throw new ZSAError("PRECONDITION_FAILED", "Invalid team passed for pick!");
          }

          const gamesInWeek = await trx
            .selectFrom("Games")
            .select([sql<number>`COUNT(*)`.as("count")])
            .where("GameWeek", "=", week)
            .executeTakeFirstOrThrow();

          if (points > gamesInWeek.count) {
            throw new ZSAError("PRECONDITION_FAILED", "Invalid point value passed for week!");
          }

          await trx
            .updateTable("Picks")
            .set({
              PickPoints: points,
              PickUpdated: new Date(),
              PickUpdatedBy: ctx.user.email,
              TeamID: teamID,
            })
            .where("PickID", "=", newPick.PickID)
            .executeTakeFirstOrThrow();
        }
      });
    } catch (error) {
      console.error("Failed to set pick", week, error);

      if (error instanceof ZSAError) {
        throw error;
      }

      throw new ZSAError("INTERNAL_SERVER_ERROR", "Failed to set pick");
    }

    revalidatePath("/picks/set");

    return {
      metadata: {},
      status: "Success",
    };
  });

export const submitMyPicks = authedProcedure
  .input(z.object({ week: weekSchema }))
  .output(serverActionResultSchema)
  .handler(async ({ ctx, input }) => {
    const { week } = input;

    try {
      await db.transaction().execute(async (trx) => {
        const picks = await trx
          .selectFrom("Picks as P")
          .select(["P.PickPoints", "P.TeamID"])
          .innerJoin("Games as G", "G.GameID", "P.GameID")
          .select(["G.GameKickoff"])
          .where("G.GameWeek", "=", week)
          .where("P.UserID", "=", ctx.user.id)
          .orderBy("P.PickPoints asc")
          .execute();

        for (let i = 0; i < picks.length; i++) {
          const pick = picks[i];
          const point = i + 1;

          if (!pick) {
            continue;
          }

          const hasGameStarted = pick.GameKickoff < new Date();

          if (pick.PickPoints !== point) {
            throw new ZSAError("PRECONDITION_FAILED", `Missing point value found! (${point})`);
          }

          if (pick.TeamID === null && !hasGameStarted) {
            throw new ZSAError("PRECONDITION_FAILED", "Missing team pick found!");
          }
        }

        const lastGame = await trx
          .selectFrom("Games")
          .select(["GameKickoff"])
          .where("GameWeek", "=", week)
          .orderBy("GameKickoff desc")
          .executeTakeFirstOrThrow();
        const lastGameHasStarted = lastGame.GameKickoff < new Date();
        const myTiebreaker = await trx
          .selectFrom("Tiebreakers")
          .select(["TiebreakerID", "TiebreakerLastScore"])
          .where("TiebreakerWeek", "=", week)
          .where("UserID", "=", ctx.user.id)
          .executeTakeFirstOrThrow();

        if (myTiebreaker.TiebreakerLastScore < 1 && !lastGameHasStarted) {
          throw new ZSAError("PRECONDITION_FAILED", "Tiebreaker last score must be greater than zero!");
        }

        await trx
          .updateTable("Tiebreakers")
          .set({
            TiebreakerHasSubmitted: 1,
            TiebreakerUpdated: new Date(),
            TiebreakerUpdatedBy: ctx.user.email,
          })
          .where("TiebreakerID", "=", myTiebreaker.TiebreakerID)
          .executeTakeFirstOrThrow();

        const notification = await trx
          .selectFrom("Notifications as N")
          .select(["N.NotificationEmail", "N.NotificationSMS", "N.NotificationPushNotification"])
          .innerJoin("Users as U", "U.UserID", "N.UserID")
          .where("U.UserCommunicationsOptedOut", "=", 0)
          .where("N.NotificationType", "=", "PicksSubmitted")
          .where("N.UserID", "=", ctx.user.id)
          .executeTakeFirst();

        if (notification?.NotificationEmail === 1) {
          await sendPicksSubmittedEmail(ctx.user, week, myTiebreaker.TiebreakerLastScore);
        }

        if (notification?.NotificationSMS === 1) {
          await sendPicksSubmittedSMS(ctx.user, week, myTiebreaker.TiebreakerLastScore);
        }

        if (notification?.NotificationPushNotification === 1) {
          const user = await db
            .selectFrom("Users")
            .select(["UserID", "UserFirstName"])
            .where("UserID", "=", ctx.user.id)
            .executeTakeFirstOrThrow();

          await sendPicksSubmittedPushNotification(user, week);
        }

        await trx
          .insertInto("Logs")
          .values({
            LogAction: "SUBMIT_PICKS",
            LogAddedBy: ctx.user.email,
            LogMessage: `${ctx.user.name ?? ctx.user.email} submitted their picks for week ${week}`,
            LogUpdatedBy: ctx.user.email,
            UserID: ctx.user.id,
          })
          .execute();
      });
    } catch (error) {
      console.error("Failed to submit picks", week, error);

      if (error instanceof ZSAError) {
        throw error;
      }

      throw new ZSAError("INTERNAL_SERVER_ERROR", "Failed to submit picks");
    }

    revalidatePath("/picks/view");

    return {
      metadata: {},
      status: "Success",
    };
  });

export const validateMyPicks = authedProcedure
  .input(validateMyPicksSchema)
  .output(serverActionResultSchema)
  .handler(async ({ ctx, input }) => {
    const { lastScore, unused, week } = input;

    try {
      await db.transaction().execute(async (trx) => {
        const unusedCount =
          !unused || unused.length === 0
            ? await trx
                .selectFrom("Picks as P")
                .select([sql<number>`COUNT(*)`.as("count")])
                .innerJoin("Games as G", "G.GameID", "P.GameID")
                .where("G.GameWeek", "=", week)
                .where("P.UserID", "=", ctx.user.id)
                .where("P.PickPoints", "is", null)
                .executeTakeFirst()
            : await trx
                .selectFrom("Picks as P")
                .select([sql<number>`COUNT(*)`.as("count")])
                .innerJoin("Games as G", "G.GameID", "P.GameID")
                .where("G.GameWeek", "=", week)
                .where("P.UserID", "=", ctx.user.id)
                .where("P.PickPoints", "in", unused)
                .executeTakeFirst();

        if (!unusedCount || unusedCount.count > 0) {
          throw new ZSAError("PRECONDITION_FAILED", "Points are not in sync");
        }

        const tiebreaker = await trx
          .selectFrom("Tiebreakers")
          .select(["TiebreakerLastScore"])
          .where("TiebreakerWeek", "=", week)
          .where("UserID", "=", ctx.user.id)
          .executeTakeFirstOrThrow();

        if (tiebreaker.TiebreakerLastScore !== lastScore) {
          throw new ZSAError("PRECONDITION_FAILED", "Tiebreaker last score on FE does not match BE");
        }
      });
    } catch (error) {
      console.error("Failed to validate picks", week, error);

      if (error instanceof ZSAError) {
        throw error;
      }

      throw new ZSAError("INTERNAL_SERVER_ERROR", "Failed to validate picks");
    }

    revalidatePath("/picks/set");

    return {
      metadata: {},
      status: "Success",
    };
  });
