import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { getUserPayments } from "@nfl-pool-monorepo/db/src/queries/payment";
import { getPaymentDueDate } from "@nfl-pool-monorepo/db/src/queries/systemValue";
import { formatDueDate } from "@nfl-pool-monorepo/utils/dates";
import { type } from "arktype";
import { sql } from "kysely";
import { jsonArrayFrom } from "kysely/helpers/mysql";
import { cache } from "react";

import { fetchTablePage, paginate, parseAdminTableParams } from "./admin-table-params";
import { getCurrentSession, requireUser } from "./sessions";
import { userFilterPredicate } from "./userFilters";

export const getAdminUsers = cache(async (params: Awaited<PageProps<"/admin/users">["searchParams"]>) => {
  const sortSchema = type({ desc: "boolean", id: type.enumerated("UserName", "UserEmail") }).array();
  const filterSchema = type({
    id: type.enumerated("UserStatus2", "UserStatus3", "UserIsOwing"),
    value: "string",
  }).array();

  const { filter, page, pageSize, sort } = parseAdminTableParams(params, {
    defaultSort: [{ desc: false, id: "UserName" as const }],
    filterSchema,
    sortSchema,
  });

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

  queryResult = sort.reduce((q, s) => q.orderBy(s.id, s.desc ? "desc" : "asc"), queryResult);
  countResult = filter.reduce((q, f) => q.where((eb) => userFilterPredicate(eb, f)), countResult);
  queryResult = filter.reduce((q, f) => q.where((eb) => userFilterPredicate(eb, f)), queryResult);
  // Cap the "all" page size so one request can't recompute every correlated subquery
  // for the entire user table.
  queryResult = paginate(queryResult, page, pageSize, 200);

  return fetchTablePage(countResult, queryResult);
});

export const getCurrentAdminId = async (): Promise<number> => (await getCurrentSession()).user?.id ?? 0;

export const getCurrentUser = cache(async () => {
  const user = await requireUser();

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

export const getMyAlerts = cache(async (): Promise<string[]> => {
  const { user } = await getCurrentSession();
  const alerts: string[] = [];

  if (!user) {
    return alerts;
  }

  const userBalance = await getUserPayments(user.id);

  if (userBalance < 0) {
    const paymentDueDate = await getPaymentDueDate();
    const dueDate = formatDueDate(paymentDueDate);

    alerts.push(`Please pay $${Math.abs(userBalance)} by ${dueDate}`);
  }

  return alerts;
});

const registeredUsersCountQuery = () =>
  db
    .selectFrom("Users")
    .select(({ fn }) => [fn.countAll<number>().as("count")])
    .where("UserDoneRegistering", "=", 1);

export const getRegisteredCount = cache(async () => {
  const result = await registeredUsersCountQuery().executeTakeFirst();

  return result?.count ?? 0;
});

export const getSurvivorCount = cache(async () => {
  const result = await registeredUsersCountQuery().where("UserPlaysSurvivor", "=", 1).executeTakeFirst();

  return result?.count ?? 0;
});

export const getTrustedUsersDropdown = cache(async () => {
  return db
    .selectFrom("Users")
    .select(["UserID", "UserName"])
    .where("UserTrusted", "=", 1)
    .orderBy("UserName", "asc")
    .execute();
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
