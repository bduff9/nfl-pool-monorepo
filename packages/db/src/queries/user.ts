import { formatDueDate } from "@nfl-pool-monorepo/utils/dates";
import { jsonArrayFrom } from "kysely/helpers/mysql";

import { db } from "../kysely";
import { getUserPayments } from "./payment";
import { getPaymentDueDate } from "./systemValue";

export const getAllRegisteredUsers = () => {
  return db
    .selectFrom("Users as u")
    .select(({ selectFrom }) => [
      "u.UserID",
      jsonArrayFrom(selectFrom("UserLeagues as ul").select(["ul.LeagueID"]).whereRef("ul.UserID", "=", "u.UserID")).as(
        "UserLeagues",
      ),
    ])
    .where("UserDoneRegistering", "=", 1)
    .execute();
};

export const getUserAlerts = async (userID: number): Promise<string[]> => {
  const alerts: string[] = [];
  const userBalance = await getUserPayments(userID);

  if (userBalance < 0) {
    const paymentDueDate = await getPaymentDueDate();
    const dueDate = formatDueDate(paymentDueDate);

    alerts.push(`Please pay $${Math.abs(userBalance)} by ${dueDate}`);
  }

  return alerts;
};
