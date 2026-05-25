import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { type } from "arktype";
import { sql } from "kysely";
import { cache } from "react";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

import { coerceNumber, parseJsonParam } from "./param-parsing";

export const getAdminLogs = cache(async (params: Awaited<PageProps<"/admin/logs">["searchParams"]>) => {
  const sortSchema = type({
    desc: "boolean",
    id: type.enumerated("LogAction", "UserName", "LogMessage", "LogAdded"),
  }).array();
  const filterSchema = type({ id: type.enumerated("LogAction", "UserName"), value: "string" }).array();

  const sort = parseJsonParam(params?.sort, sortSchema, [{ desc: true, id: "LogAdded" as const }]);
  const filter = parseJsonParam(params?.filter, filterSchema, []);
  const page = coerceNumber(params?.page, 1);
  const pageSize = params?.pageSize === "all" ? ("all" as const) : coerceNumber(params?.pageSize, DEFAULT_PAGE_SIZE);

  let countResult = db
    .selectFrom("Logs as l")
    .select(sql<number>`COUNT(*)`.as("count"))
    .leftJoin("Users as u", "u.UserID", "l.UserID");
  let queryResult = db
    .selectFrom("Logs as l")
    .select(["l.LogAction", "l.LogMessage", "l.LogAdded"])
    .leftJoin("Users as u", "u.UserID", "l.UserID")
    .select(["u.UserName"]);

  for (const s of sort) {
    queryResult = queryResult.orderBy(s.id, s.desc ? "desc" : "asc");
  }

  for (const f of filter) {
    countResult = countResult.where(f.id, "like", `%${f.value}%`);
    queryResult = queryResult.where(f.id, "like", `%${f.value}%`);
  }

  if (page && pageSize !== "all") {
    queryResult = queryResult.limit(pageSize).offset((page - 1) * pageSize);
  }

  const [count, results] = await Promise.all([countResult.executeTakeFirstOrThrow(), queryResult.execute()]);

  return { count: count.count ?? 0, results };
});
