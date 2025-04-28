import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { sql } from "kysely";
import { cache } from "react";
import { z } from "zod";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { SearchParams } from "@/lib/types";
import { stringToJSONSchema } from "@/lib/zod";

export const getAdminLogs = cache(async (params: SearchParams) => {
	const paramsSchema = z.object({
		filter: stringToJSONSchema.pipe(z.array(z.object({ id: z.enum(['LogAction', 'UserName']), value: z.string() })).optional().default([])),
		page: z.coerce.number().optional().default(1),
		pageSize: z.union([z.coerce.number(), z.literal('all')]).optional().default(DEFAULT_PAGE_SIZE),
		sort: stringToJSONSchema.pipe(z.array(z.object({ desc: z.boolean(), id: z.enum(['LogAction', 'UserName', 'LogMessage', 'LogAdded']) })).optional().default([{ desc: true, id: 'LogAdded' }])),
	});

	const { filter, page, pageSize, sort } = paramsSchema.parse(params);

	let countResult = db.selectFrom('Logs as l').select(sql<number>`COUNT(*)`.as('count')).leftJoin('Users as u', 'u.UserID', 'l.UserID');
	let queryResult = db.selectFrom('Logs as l').select(['l.LogAction', 'l.LogMessage', 'l.LogAdded']).leftJoin('Users as u', 'u.UserID', 'l.UserID').select(['u.UserName']);

	for (const s of sort) {
		queryResult = queryResult.orderBy(s.id, s.desc ? 'desc' : 'asc');
	}

	for (const f of filter) {
		countResult = countResult.where(f.id, 'like', `%${f.value}%`);
		queryResult = queryResult.where(f.id, 'like', `%${f.value}%`);
	}

	if (page && pageSize !== 'all') {
		queryResult = queryResult.limit(pageSize).offset((page - 1) * pageSize);
	}

	const [count, results] = await Promise.all([countResult.executeTakeFirstOrThrow(), queryResult.execute()]);

	return { count: count.count ?? 0, results };
});
