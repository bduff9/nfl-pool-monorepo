import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { type } from "arktype";
import { sql } from "kysely";
import { cache } from "react";

import { paginate, parseAdminTableParams } from "./admin-table-params";

export const getAdminLogs = cache(async (params: Awaited<PageProps<"/admin/logs">["searchParams"]>) => {
  const sortSchema = type({
    desc: "boolean",
    id: type.enumerated("LogAction", "UserName", "LogMessage", "LogAdded"),
  }).array();
  const filterSchema = type({ id: type.enumerated("LogAction", "UserName"), value: "string" }).array();

  const { filter, page, pageSize, sort } = parseAdminTableParams(params, {
    defaultSort: [{ desc: true, id: "LogAdded" as const }],
    filterSchema,
    sortSchema,
  });

  let countResult = db
    .selectFrom("Logs as l")
    .select(sql<number>`COUNT(*)`.as("count"))
    .leftJoin("Users as u", "u.UserID", "l.UserID");
  let queryResult = db
    .selectFrom("Logs as l")
    .select(["l.LogAction", "l.LogMessage", "l.LogAdded"])
    .leftJoin("Users as u", "u.UserID", "l.UserID")
    .select(["u.UserName"]);

  queryResult = sort.reduce((q, s) => q.orderBy(s.id, s.desc ? "desc" : "asc"), queryResult);
  countResult = filter.reduce((q, f) => q.where(f.id, "like", `%${f.value}%`), countResult);
  queryResult = filter.reduce((q, f) => q.where(f.id, "like", `%${f.value}%`), queryResult);
  queryResult = paginate(queryResult, page, pageSize);

  const [count, results] = await Promise.all([countResult.executeTakeFirstOrThrow(), queryResult.execute()]);

  return { count: count.count ?? 0, results };
});
