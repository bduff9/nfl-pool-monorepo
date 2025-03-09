'use server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import 'server-only';

import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import type { TSessionUser, FormState } from '@/utils/types';
import { fromErrorToFormState, updateMyTiebreakerScoreSchema } from '@/utils/zod';
import { db } from '@/db';

export const updateMyTiebreakerScore = async (
	week: number,
	score: number,
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

	const result = updateMyTiebreakerScoreSchema.safeParse({ week, score });

	if (!result.success) {
		return fromErrorToFormState(result.error);
	}

	try {
		const lastGame = await db
			.selectFrom('Games')
			.select(['GameKickoff'])
			.where('GameWeek', '=', week)
			.orderBy('GameKickoff desc')
			.executeTakeFirstOrThrow();

		if (lastGame.GameKickoff < new Date()) {
			return {
				fieldErrors: {},
				message: 'Last game has already started!',
				status: 'ERROR',
				timestamp: Date.now(),
			};
		}

		const myTiebreaker = await db
			.selectFrom('Tiebreakers')
			.select(['TiebreakerID', 'TiebreakerHasSubmitted'])
			.where('TiebreakerWeek', '=', week)
			.where('newUserID', '=', (session.user as TSessionUser).id)
			.executeTakeFirstOrThrow();

		if (myTiebreaker.TiebreakerHasSubmitted) {
			return {
				fieldErrors: {},
				message: 'Picks have already been submitted!',
				status: 'ERROR',
				timestamp: Date.now(),
			};
		}

		await db
			.updateTable('Tiebreakers')
			.set({
				TiebreakerLastScore: score,
				TiebreakerUpdatedBy: session.user.email ?? undefined,
				TiebreakerUpdated: new Date(),
			})
			.where('TiebreakerID', '=', myTiebreaker.TiebreakerID)
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
