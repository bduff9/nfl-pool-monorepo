import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { sql } from "kysely";
import { cache } from "react";
import { z } from "zod";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { stringToJSONSchema } from "@/lib/zod";

import { getCurrentSession } from "./sessions";

export const getAdminEmails = cache(async (params: Awaited<PageProps<"/admin/email">["searchParams"]>) => {
  const paramsSchema = z.object({
    filter: stringToJSONSchema.pipe(
      z
        .array(z.object({ id: z.enum(["EmailType"]), value: z.string() }))
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
        .array(z.object({ desc: z.boolean(), id: z.enum(["EmailType", "UserName", "EmailSubject", "EmailCreatedAt"]) }))
        .optional()
        .default([{ desc: true, id: "EmailCreatedAt" }]),
    ),
  });

  const { filter, page, pageSize, sort } = paramsSchema.parse(params);

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

  for (const s of sort) {
    queryResult = queryResult.orderBy(s.id, s.desc ? "desc" : "asc");
  }

  for (const f of filter) {
    countResult = countResult.where(f.id, "=", f.value);
    queryResult = queryResult.where(f.id, "=", f.value);
  }

  if (page && pageSize !== "all") {
    queryResult = queryResult.limit(pageSize).offset((page - 1) * pageSize);
  }

  const [count, results] = await Promise.all([countResult.executeTakeFirstOrThrow(), queryResult.execute()]);

  return { count: count.count ?? 0, results };
});

export const getEmail = cache(async (emailID: string) => {
  const { user } = await getCurrentSession();
  const result = await db
    .selectFrom("Emails")
    .select(["EmailHtml", "EmailTo", "EmailSubject"])
    .where("EmailID", "=", emailID as string)
    .executeTakeFirst();
  const userName = user?.name ?? result?.EmailTo ?? "Unknown User";

  await db
    .insertInto("Logs")
    .values({
      LogAction: "VIEW_HTML_EMAIL",
      LogAddedBy: userName,
      LogMessage: `${userName} viewed HTML version of email with subject ${result?.EmailSubject}`,
      LogUpdated: new Date(),
      LogUpdatedBy: userName,
      UserID: user?.id,
    })
    .executeTakeFirstOrThrow();

  return result?.EmailHtml ?? null;
});
