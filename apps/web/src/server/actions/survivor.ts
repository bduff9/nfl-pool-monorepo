"use server";
import { makeSurvivorPickSchema, serverActionResultSchema } from "@/lib/zod";
import { authedProcedure } from "@/lib/zsa.server";
import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { registerUserForSurvivor, unregisterUserForSurvivor } from "@nfl-pool-monorepo/db/src/mutations/users";
import { sql } from "kysely";
import { revalidatePath } from "next/cache";
import "server-only";
import { ZSAError } from "zsa";

export const makeSurvivorPick = authedProcedure
	.input(makeSurvivorPickSchema)
	.output(serverActionResultSchema)
	.handler(async ({ ctx, input }) => {
		const { gameID, teamID, week } = input;
		const mv = await db.selectFrom('SurvivorMV').select('IsAliveOverall').where('UserID', '=', ctx.user.id).executeTakeFirst();

		if (ctx.user.playsSurvivor === 0 || mv?.IsAliveOverall === 0) {
			throw new ZSAError('PRECONDITION_FAILED', 'Cannot make pick, user is already out of survivor');
		}

		const gamesStarted = await db.selectFrom('Games').select(sql<number>`COUNT(*)`.as('count')).where('GameWeek', '=', week).where('GameKickoff', '<', sql<Date>`CURRENT_TIMESTAMP`).executeTakeFirstOrThrow();

		if (gamesStarted.count > 0) {
			throw new ZSAError('PRECONDITION_FAILED', 'Week has already started, no more survivor picks can be made');
		}

		const game = await db.selectFrom('Games').select(['HomeTeamID', 'VisitorTeamID']).where('GameID', '=', gameID).where('GameWeek', '=', week).executeTakeFirstOrThrow();

		if (game.HomeTeamID !== teamID && game.VisitorTeamID !== teamID) {
			console.error('Invalid game and team sent for week', { input, user: ctx.user });

			throw new ZSAError('ERROR', 'Invalid game and team in week sent');
		}

		try {
			await db.transaction().execute(async (trx) => {
				await trx.updateTable('SurvivorPicks').set({
					GameID: gameID,
					SurvivorPickUpdated: new Date(),
					SurvivorPickUpdatedBy: ctx.user.email,
					TeamID: teamID,
				}).where('UserID', '=', ctx.user.id).where('SurvivorPickWeek', '=', week).executeTakeFirstOrThrow();

				await trx.insertInto('Logs').values({
					LogAction: 'SURVIVOR_PICK',
					LogAddedBy: ctx.user.email,
					LogMessage: `${ctx.user.name ?? ctx.user.email} made their survivor pick for week ${week}`,
					LogUpdated: new Date(),
					LogUpdatedBy: ctx.user.email,
					UserID: ctx.user.id,
				}).executeTakeFirstOrThrow();
			});
		} catch (error) {
			console.error(`Failed to make survivor pick for week ${week}`, error);

			if (error instanceof ZSAError) {
				throw error;
			}

			throw new ZSAError(
				"INTERNAL_SERVER_ERROR",
				`Failed to make survivor pick for week ${week}`,
			);
		}

		revalidatePath('/survivor/set');

		return {
			metadata: {},
			status: "Success",
		};
	});

export const registerForSurvivor = authedProcedure
	.output(serverActionResultSchema)
	.handler(async ({ ctx }) => {
		if (ctx.user.playsSurvivor) {
			throw new ZSAError("ERROR", "Already registered for survivor");
		}

		try {
			await db.transaction().execute(async (trx) => {
				await registerUserForSurvivor(trx, ctx.user.id);
			});
		} catch (error) {
			console.error("Failed to register user for survivor", error);

			if (error instanceof ZSAError) {
				throw error;
			}

			throw new ZSAError(
				"INTERNAL_SERVER_ERROR",
				"Failed to register user for survivor",
			);
		}

		revalidatePath('/', 'layout');

		return {
			metadata: {},
			status: "Success",
		};
	});

export const unregisterForSurvivor = authedProcedure
	.output(serverActionResultSchema)
	.handler(async ({ ctx }) => {
		if (!ctx.user.playsSurvivor) {
			throw new ZSAError("ERROR", "Not registered for survivor");
		}

		try {
			await db.transaction().execute(async (trx) => {
				await unregisterUserForSurvivor(trx, ctx.user.id);
			});
		} catch (error) {
			console.error("Failed to unregister user for survivor", error);

			if (error instanceof ZSAError) {
				throw error;
			}

			throw new ZSAError(
				"INTERNAL_SERVER_ERROR",
				"Failed to unregister user for survivor",
			);
		}

		revalidatePath('/', 'layout');

		return {
			metadata: {},
			status: "Success",
		};
	});
