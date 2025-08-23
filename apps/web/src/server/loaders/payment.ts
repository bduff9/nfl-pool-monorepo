import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { sql } from "kysely";
import { cache } from "react";
import "server-only";

import { jsonArrayFrom } from "kysely/helpers/mysql";
import { z } from "zod";

import { stringToJSONSchema } from "@/lib/zod";

import { getCurrentSession } from "./sessions";

export const getMyPayments = cache(async () => {
  const { user } = await getCurrentSession();

  if (!user) {
    return [];
  }

  return db
    .selectFrom("Payments")
    .select(["PaymentID", "PaymentAmount", "PaymentDescription", "PaymentWeek"])
    .where("UserID", "=", user.id)
    .orderBy((eb) => sql<string>`FIELD(${eb.ref("PaymentType")}, 'Fee', 'Paid', 'Prize', 'Payout') ASC`)
    .execute();
});

export const getUserPayoutsForAdmin = cache(async (params: Awaited<PageProps<"/admin/payments">["searchParams"]>) => {
  const paramsSchema = z.object({
    sort: stringToJSONSchema.pipe(
      z
        .array(z.object({ desc: z.boolean(), id: z.enum(["UserName", "UserWon", "UserPaymentType"]) }))
        .optional()
        .default([{ desc: false, id: "UserName" }]),
    ),
  });
  const { sort } = paramsSchema.parse(params);

  let queryResult = db
    .selectFrom("Users as u")
    .select(({ selectFrom }) => [
      "u.UserID",
      "u.UserName",
      "u.UserTeamName",
      "u.UserPaymentType",
      "u.UserPaymentAccount",
      selectFrom("Payments as p")
        .select((eb) => sql<number>`SUM(${eb.ref("p.PaymentAmount")})`.as("balance"))
        .whereRef("p.UserID", "=", "u.UserID")
        .as("UserBalance"),
      selectFrom("Payments as p")
        .select((eb) => sql<number>`SUM(${eb.ref("p.PaymentAmount")})`.as("won"))
        .whereRef("p.UserID", "=", "u.UserID")
        .where("p.PaymentType", "=", "Prize")
        .as("UserWon"),
      selectFrom("Payments as p")
        .select((eb) => sql<number>`SUM(${eb.ref("p.PaymentAmount")})`.as("paidOut"))
        .whereRef("p.UserID", "=", "u.UserID")
        .where("p.PaymentType", "=", "Payout")
        .as("UserPaidOut"),
      jsonArrayFrom(
        selectFrom("Payments as p")
          .select(["p.PaymentAmount", "p.PaymentDescription", "p.PaymentWeek"])
          .whereRef("p.UserID", "=", "u.UserID")
          .where("p.PaymentType", "=", "Prize")
          .orderBy("p.PaymentWeek", "asc"),
      ).as("payouts"),
    ])
    .where((eb) => eb("UserID", "in", eb.selectFrom("Payments").select("UserID").where("PaymentType", "=", "Prize")));

  for (const s of sort) {
    queryResult = queryResult.orderBy(s.id, s.desc ? "desc" : "asc");
  }

  return queryResult.execute();
});
