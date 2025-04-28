import { db } from "../kysely";

export const getLowestUnusedPoint = async (
	week: number,
	userId: number,
): Promise<null | number> => {
	const usedResult = await db.selectFrom('Picks as p')
		.select('p.PickPoints as points')
		.innerJoin('Games as g', 'g.GameID', 'p.GameID')
		.where('p.UserID', '=', userId)
		.where('g.GameWeek', '=', week)
		.execute();
	const used = usedResult.map(({ points }) => points).filter(points => points !== null);

	for (let point = 1; point <= usedResult.length; point++) {
		if (used.includes(point)) continue;

		return point;
	}

	return null;
};
