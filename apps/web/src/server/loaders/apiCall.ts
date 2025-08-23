import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { sql } from "kysely";
import { cache } from "react";
import { z } from "zod";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { stringToJSONSchema } from "@/lib/zod";

export const loadAPICalls = cache(async (params: Awaited<PageProps<"/admin/api">["searchParams"]>) => {
  const paramsSchema = z.object({
    filter: stringToJSONSchema.pipe(
      z
        .array(z.object({ id: z.enum(["ApiCallWeek"]), value: z.string() }))
        .optional()
        .default([]),
    ),
    page: z.coerce.number().optional().default(1),
    pageSize: z
      .union([z.coerce.number(), z.literal("all")])
      .optional()
      .default(DEFAULT_PAGE_SIZE),
    sort: stringToJSONSchema.pipe(
      z
        .array(
          z.object({
            desc: z.boolean(),
            id: z.enum(["ApiCallID", "ApiCallUrl", "ApiCallYear", "ApiCallWeek", "ApiCallDate"]),
          }),
        )
        .optional()
        .default([{ desc: true, id: "ApiCallID" }]),
    ),
  });

  const { filter, page, pageSize, sort } = paramsSchema.parse(params);

  let countResult = db.selectFrom("ApiCalls").select(sql<number>`COUNT(*)`.as("count"));
  let queryResult = db.selectFrom("ApiCalls").selectAll();

  for (const s of sort) {
    queryResult = queryResult.orderBy(s.id, s.desc ? "desc" : "asc");
  }

  for (const f of filter) {
    countResult = countResult.where(f.id, "=", Number(f.value));
    queryResult = queryResult.where(f.id, "=", Number(f.value));
  }

  if (page && pageSize !== "all") {
    queryResult = queryResult.limit(pageSize).offset((page - 1) * pageSize);
  }

  const [count, results] = await Promise.all([countResult.executeTakeFirstOrThrow(), queryResult.execute()]);

  return { count: count.count ?? 0, results };
});
