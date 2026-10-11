import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { type } from "arktype";
import { sql } from "kysely";
import { cache } from "react";

import { fetchTablePage, paginate, parseAdminTableParams } from "./admin-table-params";
import { buildEmailViewLog } from "./emailView";
import { getCurrentSession } from "./sessions";

export const getAdminEmails = cache(async (params: Awaited<PageProps<"/admin/email">["searchParams"]>) => {
  const sortSchema = type({
    desc: "boolean",
    id: type.enumerated("EmailType", "UserName", "EmailSubject", "EmailCreatedAt"),
  }).array();
  const filterSchema = type({ id: type.enumerated("EmailType"), value: "string" }).array();

  const { filter, page, pageSize, sort } = parseAdminTableParams(params, {
    defaultSort: [{ desc: true, id: "EmailCreatedAt" as const }],
    filterSchema,
    sortSchema,
  });

  let countResult = db
    .selectFrom("Emails as e")
    .select(sql<number>`COUNT(*)`.as("count"))
    .leftJoin("Users as u", "u.UserEmail", "e.EmailTo");
  let queryResult = db
    .selectFrom("Emails as e")
    .select([
      "e.EmailID",
      "e.EmailType",
      "e.EmailTo",
      "e.EmailSubject",
      "e.EmailHtml",
      "e.EmailSms",
      "e.EmailCreatedAt",
    ])
    .leftJoin("Users as u", "u.UserEmail", "e.EmailTo")
    .select(["u.UserName"]);

  queryResult = sort.reduce((q, s) => q.orderBy(s.id, s.desc ? "desc" : "asc"), queryResult);
  countResult = filter.reduce((q, f) => q.where(f.id, "=", f.value), countResult);
  queryResult = filter.reduce((q, f) => q.where(f.id, "=", f.value), queryResult);
  queryResult = paginate(queryResult, page, pageSize);

  return fetchTablePage(countResult, queryResult);
});

export const getEmail = cache(async (emailID: string) => {
  const { user } = await getCurrentSession();
  const result = await db
    .selectFrom("Emails")
    .select(["EmailHtml", "EmailTo", "EmailSubject"])
    .where("EmailID", "=", emailID)
    .executeTakeFirst();

  await db
    .insertInto("Logs")
    .values(buildEmailViewLog(user, result, new Date()))
    .executeTakeFirstOrThrow();

  return result?.EmailHtml ?? null;
});

export const getEmailRecipient = cache(async (emailID: string): Promise<string | null> => {
  const result = await db.selectFrom("Emails").select("EmailTo").where("EmailID", "=", emailID).executeTakeFirst();

  return result?.EmailTo ?? null;
});
