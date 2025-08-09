import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { sql } from "kysely";
import { jsonArrayFrom } from "kysely/helpers/mysql";
import { cache } from "react";
import { z } from "zod";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { SearchParams } from "@/lib/types";
import { stringToJSONSchema } from "@/lib/zod";

import { getCurrentSession } from "./sessions";

export const getAdminUsers = cache(async (params: SearchParams) => {
  const paramsSchema = z.object({
    filter: stringToJSONSchema.pipe(
      z
        .array(
          z.object({
            id: z.enum(["UserStatus2", "UserStatus3", "UserIsOwing"]),
            value: z.string(),
          }),
        )
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
            id: z.enum(["UserName", "UserEmail"]),
          }),
        )
        .optional()
        .default([{ desc: false, id: "UserName" }]),
    ),
  });

  const { filter, page, pageSize, sort } = paramsSchema.parse(params);

  let countResult = db.selectFrom("Users as u").select(sql<number>`COUNT(*)`.as("count"));
  let queryResult = db.selectFrom("Users as u").select(({ ref, selectFrom }) => [
    "u.UserID",
    "u.UserEmail",
    "u.UserFirstName",
    "u.UserLastName",
    "u.UserName",
    "u.UserTeamName",
    "u.UserPlaysSurvivor",
    "u.UserAutoPicksLeft",
    "u.UserAutoPickStrategy",
    "u.UserDoneRegistering",
    "u.UserTrusted",
    "u.UserReferredByRaw",
    "u.UserCommunicationsOptedOut",
    selectFrom("Payments as p")
      .select((eb) => sql<number>`ABS(SUM(${eb.ref("p.PaymentAmount")}))`.as("owes"))
      .whereRef("p.UserID", "=", "u.UserID")
      .where("p.PaymentType", "=", "Fee")
      .as("UserOwes"),
    sql<number>`(${selectFrom("Payments as p")
      .select((eb) => sql<number>`SUM(${eb.ref("p.PaymentAmount")})`.as("balance"))
      .whereRef("p.UserID", "=", "u.UserID")}) < 0`.as("UserIsOwing"),
    selectFrom("Payments as p")
      .select((eb) => sql<number>`ABS(SUM(${eb.ref("p.PaymentAmount")}))`.as("paid"))
      .whereRef("p.UserID", "=", "u.UserID")
      .where("p.PaymentType", "=", "Paid")
      .as("UserPaid"),
    selectFrom("Users as rb")
      .select("rb.UserName")
      .whereRef("rb.UserID", "=", "u.UserReferredBy")
      .as("referredByUserName"),
    selectFrom("UserHistory as uh")
      .select((eb) => sql<string>`group_concat(${eb.ref("uh.UserHistoryYear")})`.as("yearsPlayed"))
      .whereRef("uh.UserID", "=", "u.UserID")
      .as("YearsPlayed"),
    sql<string>`CASE WHEN ${ref("u.UserDoneRegistering")} = 1 THEN 'Registered' WHEN ${ref("u.UserTrusted")} = 1 THEN 'Verified' WHEN ${ref("u.UserEmailVerified")} = 1 THEN 'Untrusted' ELSE 'Unverified' END`.as(
      "UserStatus",
    ),
    sql<string>`CASE WHEN ${ref("u.UserDoneRegistering")} = 1 THEN 'Registered' WHEN ${ref("u.UserTrusted")} = 1 THEN 'Inactive' ELSE 'Incomplete' END`.as(
      "UserStatus2",
    ),
    sql<string>`CASE WHEN ${ref("u.UserDoneRegistering")} <> 1 THEN 'Not Registered' WHEN ${selectFrom("UserHistory as uh").select(sql<number>`COUNT(*)`.as("count")).whereRef("uh.UserID", "=", "u.UserID")} = 1 THEN 'Rookie' ELSE 'Veteran' END`.as(
      "UserStatus3",
    ),
    sql<number>`${ref("u.UserPasswordHash")} IS NOT NULL`.as("UserHasPassword"),
    sql<number>`(${selectFrom("Accounts as a")
      .select(sql<number>`COUNT(*)`.as("count"))
      .whereRef("a.UserID", "=", "u.UserID")
      .where("a.AccountProviderID", "=", "google")}) > 0`.as("UserHasGoogle"),
    jsonArrayFrom(
      selectFrom("Notifications as n")
        .select([
          "n.NotificationID",
          "n.NotificationEmail",
          "n.NotificationSMS",
          "n.NotificationEmailHoursBefore",
          "n.NotificationSMSHoursBefore",
        ])
        .innerJoin("NotificationTypes as nt", "n.NotificationType", "nt.NotificationType")
        .select(["nt.NotificationTypeDescription"])
        .whereRef("n.UserID", "=", "u.UserID")
        .where((eb) => eb.or([eb("n.NotificationEmail", "=", 1), eb("n.NotificationSMS", "=", 1)])),
    ).as("UserNotifications"),
  ]);

  for (const s of sort) {
    queryResult = queryResult.orderBy(s.id, s.desc ? "desc" : "asc");
  }

  for (const f of filter) {
    if (f.id === "UserStatus2") {
      countResult = countResult.where((eb) =>
        eb(
          sql<string>`CASE WHEN ${eb.ref("u.UserDoneRegistering")} = 1 THEN 'Registered' WHEN ${eb.ref("u.UserTrusted")} = 1 THEN 'Inactive' ELSE 'Incomplete' END`,
          "=",
          f.value,
        ),
      );
      queryResult = queryResult.where((eb) =>
        eb(
          sql<string>`CASE WHEN ${eb.ref("u.UserDoneRegistering")} = 1 THEN 'Registered' WHEN ${eb.ref("u.UserTrusted")} = 1 THEN 'Inactive' ELSE 'Incomplete' END`,
          "=",
          f.value,
        ),
      );
    } else if (f.id === "UserStatus3") {
      countResult = countResult.where((eb) =>
        eb(
          sql<string>`CASE WHEN ${eb.ref("u.UserDoneRegistering")} <> 1 THEN 'Not Registered' WHEN ${eb.selectFrom("UserHistory as uh").select(sql<number>`COUNT(*)`.as("count")).whereRef("uh.UserID", "=", "u.UserID")} = 1 THEN 'Rookie' ELSE 'Veteran' END`,
          "=",
          f.value,
        ),
      );
      queryResult = queryResult.where((eb) =>
        eb(
          sql<string>`CASE WHEN ${eb.ref("u.UserDoneRegistering")} <> 1 THEN 'Not Registered' WHEN ${eb.selectFrom("UserHistory as uh").select(sql<number>`COUNT(*)`.as("count")).whereRef("uh.UserID", "=", "u.UserID")} = 1 THEN 'Rookie' ELSE 'Veteran' END`,
          "=",
          f.value,
        ),
      );
    } else if (f.id === "UserIsOwing") {
      countResult = countResult.where(
        (eb) =>
          sql<number>`(${eb
            .selectFrom("Payments as p")
            .select((eb) => sql<number>`SUM(${eb.ref("p.PaymentAmount")})`.as("balance"))
            .whereRef("p.UserID", "=", "u.UserID")}) < 0`,
        "=",
        Number(f.value),
      );
      queryResult = queryResult.where(
        (eb) =>
          sql<number>`(${eb
            .selectFrom("Payments as p")
            .select((eb) => sql<number>`SUM(${eb.ref("p.PaymentAmount")})`.as("balance"))
            .whereRef("p.UserID", "=", "u.UserID")}) < 0`,
        "=",
        Number(f.value),
      );
    }
  }

  if (pageSize !== "all") {
    queryResult = queryResult.limit(pageSize).offset((page - 1) * pageSize);
  }

  const [count, results] = await Promise.all([countResult.executeTakeFirstOrThrow(), queryResult.execute()]);

  return { count: count.count ?? 0, results };
});

export const getCurrentUser = cache(async () => {
  const { user } = await getCurrentSession();

  if (!user) {
    throw new Error("Not logged in");
  }

  return db
    .selectFrom("Users")
    .select([
      "UserID",
      "UserEmail",
      "UserFirstName",
      "UserLastName",
      "UserName",
      "UserTeamName",
      "UserReferredByRaw",
      "UserPaymentType",
      "UserPaymentAccount",
      "UserPlaysSurvivor",
      "UserTrusted",
      "UserPhone",
      "UserAutoPicksLeft",
      "UserAutoPickStrategy",
    ])
    .where("UserID", "=", user.id)
    .executeTakeFirstOrThrow();
});

export const getRegisteredCount = cache(async () => {
  const result = await db
    .selectFrom("Users")
    .select(({ fn }) => [fn.countAll<number>().as("count")])
    .where("UserDoneRegistering", "=", 1)
    .executeTakeFirst();

  return result?.count ?? 0;
});

export const getSurvivorCount = cache(async () => {
  const result = await db
    .selectFrom("Users")
    .select(({ fn }) => [fn.countAll<number>().as("count")])
    .where("UserDoneRegistering", "=", 1)
    .where("UserPlaysSurvivor", "=", 1)
    .executeTakeFirst();

  return result?.count ?? 0;
});

export const userHasGoogle = cache(async (userId: number): Promise<boolean> => {
  const result = await db
    .selectFrom("Accounts")
    .select("AccountID")
    .where("UserID", "=", userId)
    .where("AccountProviderID", "=", "google")
    .execute();

  return result.length > 0;
});
