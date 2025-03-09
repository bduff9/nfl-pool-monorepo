'use server';
import { sql } from 'kysely';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import 'server-only';

import type { Users_UserAutoPickStrategy } from '@/db/types';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import {
	autoPickSchema,
	fromErrorToFormState,
	setMyPickSchema,
	validateMyPicksSchema,
	weekSchema,
} from '@/utils/zod';
import { type TSessionUser, type FormState } from '@/utils/types';
import { db } from '@/db';

const shouldAutoPickHome = (type: Users_UserAutoPickStrategy): boolean => {
	if (type === 'Home') return true;

	if (type === 'Away') return false;

	return !!Math.round(Math.random());
};

export const autoPickMyPicks = async (
	week: number,
	type: Users_UserAutoPickStrategy,
): Promise<FormState> => {
	const session = await getServerSession(authOptions);

	if (!session?.user) {
		return {
			fieldErrors: {},
			message: 'Not authorized',
			status: 'ERROR',
			timestamp: Date.now(),
		};
	}

	const result = autoPickSchema.safeParse({ week, type });

	if (!result.success) {
		return fromErrorToFormState(result.error);
	}

	try {
		const picksForWeek = await db
			.selectFrom('Picks as P')
			.select(['P.PickID', 'P.PickPoints'])
			.innerJoin('Games as G', 'G.GameID', 'P.GameID')
			.select(['G.GameKickoff', 'G.HomeTeamID', 'G.VisitorTeamID'])
			.where('G.GameWeek', '=', week)
			.where('P.newUserID', '=', (session.user as TSessionUser).id)
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
		const unmadePicks = picksForWeek.filter(pick => {
			if (pick.PickPoints) return false;

			const hasStarted = pick.GameKickoff < new Date();

			if (hasStarted) return false;

			return true;
		});

		for (const pick of unmadePicks) {
			const pointIndex = Math.floor(Math.random() * availablePoints.length);
			const PickPoints = availablePoints.splice(pointIndex, 1)[0];
			const PickUpdated = new Date();
			const PickUpdatedBy = session.user.email ?? undefined;
			let TeamID: number;

			if (shouldAutoPickHome(type)) {
				TeamID = pick.HomeTeamID;
			} else {
				TeamID = pick.VisitorTeamID;
			}

			await db
				.updateTable('Picks')
				.set({ PickPoints, PickUpdated, PickUpdatedBy, TeamID })
				.where('PickID', '=', pick.PickID)
				.execute();
		}
	} catch (error) {
		return fromErrorToFormState(error);
	}

	revalidatePath('/picks/set');

	return {
		fieldErrors: {},
		message: '',
		status: 'SUCCESS',
		timestamp: Date.now(),
	};
};

export const resetMyPicksForWeek = async (week: number): Promise<FormState> => {
	const session = await getServerSession(authOptions);

	if (!session?.user) {
		return {
			fieldErrors: {},
			message: 'Not authorized',
			status: 'ERROR',
			timestamp: Date.now(),
		};
	}

	const result = weekSchema.safeParse(week);

	if (!result.success) {
		return fromErrorToFormState(result.error);
	}

	try {
		await db
			.updateTable('Picks')
			.set({
				TeamID: null,
				PickPoints: null,
				PickUpdated: new Date(),
				PickUpdatedBy: (session.user as TSessionUser).email,
			})
			.where('newUserID', '=', (session.user as TSessionUser).id)
			.where(({ eb, selectFrom }) =>
				eb(
					'GameID',
					'in',
					selectFrom('Games')
						.select('GameID')
						.where('GameWeek', '=', week)
						.where('GameKickoff', '>', sql<Date>`CURRENT_TIMESTAMP`),
				),
			)
			.execute();
	} catch (error) {
		return fromErrorToFormState(error);
	}

	revalidatePath('/picks/set');

	return {
		fieldErrors: {},
		message: '',
		status: 'SUCCESS',
		timestamp: Date.now(),
	};
};

export const setMyPick = async (
	week: number,
	gameID: null | number,
	teamID: null | number,
	points: number,
): Promise<FormState> => {
	const session = await getServerSession(authOptions);

	if (!session?.user) {
		return {
			fieldErrors: {},
			message: 'Not authorized',
			status: 'ERROR',
			timestamp: Date.now(),
		};
	}

	const result = setMyPickSchema.safeParse({ week, gameID, teamID, points });

	if (!result.success) {
		return fromErrorToFormState(result.error);
	}

	try {
		const oldPick = await db
			.selectFrom('Picks as P')
			.selectAll('P')
			.innerJoin('Games as G', 'G.GameID', 'P.GameID')
			.selectAll('G')
			.where('G.GameWeek', '=', week)
			.where('P.newUserID', '=', (session.user as TSessionUser).id)
			.where('P.PickPoints', '=', points)
			.executeTakeFirst();

		if (oldPick) {
			const hasStarted = oldPick.GameKickoff < new Date();

			if (hasStarted) {
				return {
					fieldErrors: {},
					message: 'Game has already started!',
					status: 'ERROR',
					timestamp: Date.now(),
				};
			}

			await db
				.updateTable('Picks')
				.set({
					TeamID: null,
					PickPoints: null,
					PickUpdated: new Date(),
					PickUpdatedBy: (session.user as TSessionUser).email,
				})
				.where('PickID', '=', oldPick.PickID)
				.execute();
		}

		if (gameID) {
			const newPick = await db
				.selectFrom('Picks as P')
				.selectAll('P')
				.innerJoin('Games as G', 'G.GameID', 'P.GameID')
				.selectAll('G')
				.where('P.GameID', '=', gameID)
				.where('G.GameWeek', '=', week)
				.where('G.GameKickoff', '>', sql<Date>`CURRENT_TIMESTAMP`)
				.where('P.newUserID', '=', (session.user as TSessionUser).id)
				.executeTakeFirst();

			if (!newPick) {
				return {
					fieldErrors: {},
					message: 'No pick that can be changed found!',
					status: 'ERROR',
					timestamp: Date.now(),
				};
			}

			if (newPick.HomeTeamID !== teamID && newPick.VisitorTeamID !== teamID) {
				return {
					fieldErrors: {},
					message: 'Invalid team passed for pick!',
					status: 'ERROR',
					timestamp: Date.now(),
				};
			}

			const gamesInWeek = await db
				.selectFrom('Games')
				.select([sql<number>`COUNT(*)`.as('count')])
				.where('GameWeek', '=', week)
				.executeTakeFirstOrThrow();

			if (points > gamesInWeek.count) {
				return {
					fieldErrors: {},
					message: 'Invalid point value passed for week!',
					status: 'ERROR',
					timestamp: Date.now(),
				};
			}

			await db
				.updateTable('Picks')
				.set({
					TeamID: teamID,
					PickPoints: points,
					PickUpdated: new Date(),
					PickUpdatedBy: (session.user as TSessionUser).email,
				})
				.where('PickID', '=', newPick.PickID)
				.execute();
		}
	} catch (error) {
		return fromErrorToFormState(error);
	}

	revalidatePath('/picks/set');

	return {
		fieldErrors: {},
		message: '',
		status: 'SUCCESS',
		timestamp: Date.now(),
	};
};

export const submitMyPicks = async (week: number): Promise<FormState> => {
	const session = await getServerSession(authOptions);

	if (!session?.user) {
		return {
			fieldErrors: {},
			message: 'Not authorized',
			status: 'ERROR',
			timestamp: Date.now(),
		};
	}

	const result = weekSchema.safeParse(week);

	if (!result.success) {
		return fromErrorToFormState(result.error);
	}

	try {
		const picks = await db
			.selectFrom('Picks as P')
			.select(['P.PickPoints', 'P.TeamID'])
			.innerJoin('Games as G', 'G.GameID', 'P.GameID')
			.select(['G.GameKickoff'])
			.where('G.GameWeek', '=', week)
			.where('P.newUserID', '=', (session.user as TSessionUser).id)
			.orderBy('P.PickPoints asc')
			.execute();

		for (let i = 0; i < picks.length; i++) {
			const pick = picks[i];
			const point = i + 1;
			const hasGameStarted = pick.GameKickoff < new Date();

			if (pick.PickPoints !== point) {
				return {
					fieldErrors: {},
					message: 'Missing point value found!',
					status: 'ERROR',
					timestamp: Date.now(),
				};
			}

			if (pick.TeamID === null && !hasGameStarted) {
				return {
					fieldErrors: {},
					message: 'Missing team pick found!',
					status: 'ERROR',
					timestamp: Date.now(),
				};
			}
		}

		const lastGame = await db
			.selectFrom('Games')
			.select(['GameKickoff'])
			.where('GameWeek', '=', week)
			.orderBy('GameKickoff desc')
			.executeTakeFirstOrThrow();
		const lastGameHasStarted = lastGame.GameKickoff < new Date();
		const myTiebreaker = await db
			.selectFrom('Tiebreakers')
			.select(['TiebreakerID', 'TiebreakerLastScore'])
			.where('TiebreakerWeek', '=', week)
			.where('newUserID', '=', (session.user as TSessionUser).id)
			.executeTakeFirstOrThrow();

		if (myTiebreaker.TiebreakerLastScore < 1 && !lastGameHasStarted) {
			return {
				fieldErrors: {},
				message: 'Tiebreaker last score must be greater than zero!',
				status: 'ERROR',
				timestamp: Date.now(),
			};
		}

		await db
			.updateTable('Tiebreakers')
			.set({
				TiebreakerHasSubmitted: 1,
				TiebreakerUpdatedBy: session.user.email ?? undefined,
			})
			.where('TiebreakerID', '=', myTiebreaker.TiebreakerID)
			.execute();

		const notification = await db
			.selectFrom('Notifications as N')
			.select(['N.NotificationEmail', 'N.NotificationSMS'])
			.innerJoin('Users as U', 'U.UserID', 'N.newUserID')
			.where('U.UserCommunicationsOptedOut', '=', 0)
			.where('N.NotificationType', '=', 'PicksSubmitted')
			.where('N.newUserID', '=', (session.user as TSessionUser).id)
			.executeTakeFirst();

		if (notification?.NotificationEmail) {
			// await sendPicksSubmittedEmail(user, week, picks, myTiebreaker);
		}

		if (notification?.NotificationSMS) {
			// await sendPicksSubmittedSMS(user, week, picks, myTiebreaker);
		}

		await db
			.insertInto('Logs')
			.values({
				LogAction: 'SUBMIT_PICKS',
				LogMessage: `${(session.user as TSessionUser).name} submitted their picks for week ${week}`,
				LogAddedBy: (session.user as TSessionUser).email ?? '',
				LogUpdatedBy: (session.user as TSessionUser).email ?? '',
				newUserID: (session.user as TSessionUser).id,
			})
			.execute();
	} catch (error) {
		return fromErrorToFormState(error);
	}

	revalidatePath('/picks/view');

	return {
		fieldErrors: {},
		message: '',
		status: 'SUCCESS',
		timestamp: Date.now(),
	};
};

export const validateMyPicks = async (
	week: number,
	unused: number[],
	lastScore: number,
): Promise<FormState> => {
	const session = await getServerSession(authOptions);

	if (!session?.user) {
		return {
			fieldErrors: {},
			message: 'Not authorized',
			status: 'ERROR',
			timestamp: Date.now(),
		};
	}

	const result = validateMyPicksSchema.safeParse({
		lastScore,
		unused,
		week,
	});

	if (!result.success) {
		return fromErrorToFormState(result.error);
	}

	try {
		const unusedCount =
			!unused || unused.length === 0
				? await db
						.selectFrom('Picks as P')
						.select([sql<number>`COUNT(*)`.as('count')])
						.innerJoin('Games as G', 'G.GameID', 'P.GameID')
						.where('G.GameWeek', '=', week)
						.where('P.newUserID', '=', (session.user as TSessionUser).id)
						.where('P.PickPoints', 'is', null)
						.executeTakeFirst()
				: await db
						.selectFrom('Picks as P')
						.select([sql<number>`COUNT(*)`.as('count')])
						.innerJoin('Games as G', 'G.GameID', 'P.GameID')
						.where('G.GameWeek', '=', week)
						.where('P.newUserID', '=', (session.user as TSessionUser).id)
						.where('P.PickPoints', 'in', unused)
						.executeTakeFirst();

		if (!unusedCount || unusedCount.count > 0) {
			return {
				fieldErrors: {},
				message: 'Points are not in sync',
				status: 'ERROR',
				timestamp: Date.now(),
			};
		}

		const tiebreaker = await db
			.selectFrom('Tiebreakers')
			.select(['TiebreakerLastScore'])
			.where('TiebreakerWeek', '=', week)
			.where('newUserID', '=', (session.user as TSessionUser).id)
			.executeTakeFirstOrThrow();

		if (tiebreaker.TiebreakerLastScore !== lastScore) {
			return {
				fieldErrors: {},
				message: 'Tiebreaker last score on FE does not match BE',
				status: 'ERROR',
				timestamp: Date.now(),
			};
		}
	} catch (error) {
		return fromErrorToFormState(error);
	}

	revalidatePath('/picks/set');

	return {
		fieldErrors: {},
		message: '',
		status: 'SUCCESS',
		timestamp: Date.now(),
	};
};
