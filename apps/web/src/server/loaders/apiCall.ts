import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { type } from "arktype";
import { sql } from "kysely";
import { cache } from "react";

import { fetchTablePage, paginate, parseAdminTableParams } from "./admin-table-params";

export const loadAPICalls = cache(async (params: Awaited<PageProps<"/admin/api">["searchParams"]>) => {
  const sortSchema = type({
    desc: "boolean",
    id: type.enumerated("ApiCallID", "ApiCallUrl", "ApiCallYear", "ApiCallWeek", "ApiCallDate"),
  }).array();
  const filterSchema = type({ id: type.enumerated("ApiCallWeek"), value: "string" }).array();

  // Cap the "all" page size so a single request can't pull every row's full JSON payload.
  const { filter, page, pageSize, sort } = parseAdminTableParams(params, {
    defaultSort: [{ desc: true, id: "ApiCallID" as const }],
    filterSchema,
    maxPageSize: 100,
    sortSchema,
  });

  let countResult = db.selectFrom("ApiCalls").select(sql<number>`COUNT(*)`.as("count"));
  let queryResult = db.selectFrom("ApiCalls").selectAll();

  queryResult = sort.reduce((q, s) => q.orderBy(s.id, s.desc ? "desc" : "asc"), queryResult);
  countResult = filter.reduce((q, f) => q.where(f.id, "=", Number(f.value)), countResult);
  queryResult = filter.reduce((q, f) => q.where(f.id, "=", Number(f.value)), queryResult);
  queryResult = paginate(queryResult, page, pageSize, 200);

  return fetchTablePage(countResult, queryResult);
});
