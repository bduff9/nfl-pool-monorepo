import type { Selectable } from "kysely";

import type { Payments } from "..";
import { db } from "../kysely";

export const getUserPayments = async (userID: number, type?: Selectable<Payments>["PaymentType"]): Promise<number> => {
  const result = await db
    .selectFrom("Payments")
    .select(({ fn }) => fn.sum<number>("PaymentAmount").as("PaymentAmount"))
    .where("UserID", "=", userID)
    .$if(!!type, (qb) => qb.where("PaymentType", "=", type as Selectable<Payments>["PaymentType"]))
    .executeTakeFirst();
  const amount = result?.PaymentAmount ?? 0;

  return type ? Math.abs(amount) : amount;
};

export const getUsersWhoOwe = () => {
  return db
    .selectFrom("Payments")
    .select(({ fn }) => ["UserID", fn.sum<number>("PaymentAmount").as("balance")])
    .groupBy("UserID")
    .having(({ fn }) => fn.sum<number>("PaymentAmount"), "<", 0)
    .execute();
};
