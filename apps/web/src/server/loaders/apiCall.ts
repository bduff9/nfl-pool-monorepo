import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { type } from "arktype";
import { sql } from "kysely";
import { cache } from "react";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

import { coerceNumber, parseJsonParam } from "./param-parsing";

export const loadAPICalls = cache(async (params: Awaited<PageProps<"/admin/api">["searchParams"]>) => {
  const sortSchema = type({
    desc: "boolean",
    id: type.enumerated("ApiCallID", "ApiCallUrl", "ApiCallYear", "ApiCallWeek", "ApiCallDate"),
  }).array();
  const filterSchema = type({ id: type.enumerated("ApiCallWeek"), value: "string" }).array();

  const sort = parseJsonParam(params?.sort, sortSchema, [{ desc: true, id: "ApiCallID" as const }]);
  const filter = parseJsonParam(params?.filter, filterSchema, []);
  const page = coerceNumber(params?.page, 1);
  const pageSize = params?.pageSize === "all" ? ("all" as const) : coerceNumber(params?.pageSize, DEFAULT_PAGE_SIZE);

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
