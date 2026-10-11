import type { DB } from "@nfl-pool-monorepo/db/src";
import { type ExpressionBuilder, sql } from "kysely";

type UserEb = ExpressionBuilder<DB & { u: DB["Users"] }, "u">;
type UserFilterId = "UserStatus2" | "UserStatus3" | "UserIsOwing";

const userFilterPredicates = {
  UserIsOwing: (eb: UserEb, value: string) =>
    eb(
      sql<number>`(${eb
        .selectFrom("Payments as p")
        .select((pe) => sql<number>`SUM(${pe.ref("p.PaymentAmount")})`.as("balance"))
        .whereRef("p.UserID", "=", "u.UserID")}) < 0`,
      "=",
      Number(value),
    ),
  UserStatus2: (eb: UserEb, value: string) =>
    eb(
      sql<string>`CASE WHEN ${eb.ref("u.UserDoneRegistering")} = 1 THEN 'Registered' WHEN ${eb.ref("u.UserTrusted")} = 1 THEN 'Inactive' ELSE 'Incomplete' END`,
      "=",
      value,
    ),
  UserStatus3: (eb: UserEb, value: string) =>
    eb(
      sql<string>`CASE WHEN ${eb.ref("u.UserDoneRegistering")} <> 1 THEN 'Not Registered' WHEN ${eb.selectFrom("UserHistory as uh").select(sql<number>`COUNT(*)`.as("count")).whereRef("uh.UserID", "=", "u.UserID")} = 1 THEN 'Rookie' ELSE 'Veteran' END`,
      "=",
      value,
    ),
};

export const userFilterPredicate = (eb: UserEb, filter: { id: UserFilterId; value: string }) =>
  userFilterPredicates[filter.id](eb, filter.value);
