import { sql } from 'kysely';
import { db } from '../kysely';

export const getCurrentWeekInProgress = async (): Promise<number | null> => {
	const game = await db.selectFrom('Games').select('GameWeek').where('GameNumber', '=', 1).where('GameKickoff', '<', sql<Date>`CURRENT_TIMESTAMP`).orderBy('GameKickoff desc').executeTakeFirst();

	return game?.GameWeek ?? null;
};
