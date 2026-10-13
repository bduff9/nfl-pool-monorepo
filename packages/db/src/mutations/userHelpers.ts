import { type Kysely, type Selectable, sql } from "kysely";

import type { DB, Payments } from "..";

export const upcomingSeasonOpenerQuery = (executor: Pick<Kysely<DB>, "selectFrom">) =>
  executor
    .selectFrom("Games")
    .select("GameID")
    .where("GameNumber", "=", 1)
    .where("GameWeek", "=", 1)
    .where("GameKickoff", ">", sql<Date>`CURRENT_TIMESTAMP`);

// Money paid in ("Paid") is the only thing that blocks deregistration; entry fees are owed, and prizes/payouts are money out.
export const canDeregister = (payments: ReadonlyArray<Pick<Selectable<Payments>, "PaymentType">>): boolean =>
  payments.every((payment) => payment.PaymentType !== "Paid");
