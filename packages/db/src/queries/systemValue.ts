import { getCurrentSeasonYear } from "@nfl-pool-monorepo/utils/dates";
import { type } from "arktype";
import type { Transaction } from "kysely";
import { cache } from "react";

import type { DB } from "..";
import { db } from "../kysely";
import { loadPrizes, systemValueQuery } from "./systemValueHelpers";

const parseOverallPrizes = type("string.json.parse").to(["number", "number", "number", "number"]);
const parseThreePrizes = type("string.json.parse").to(["number", "number", "number"]);

const getNumericSystemValue = async (name: string): Promise<number> => {
  const systemValue = await systemValueQuery(db, name).executeTakeFirst();

  return Number(systemValue?.SystemValueValue ?? "0");
};

export const getOverallPrizeAmounts = cache(
  (): Promise<[number, number, number, number]> =>
    loadPrizes(db, "OverallPrizes", "overall", parseOverallPrizes, [0, 0, 0, 0]),
);

export const getOverallPrizeForLastPlace = cache(() => getNumericSystemValue("PoolCost"));

export const getPaymentDueWeek = cache(() => getNumericSystemValue("PaymentDueWeek"));

export const getPaymentDueDate = cache(async (): Promise<Date> => {
  const dueWeek = await getPaymentDueWeek();
  const lastGame = await db
    .selectFrom("Games")
    .select("GameKickoff")
    .where("GameWeek", "=", dueWeek)
    .orderBy("GameKickoff", "desc")
    .executeTakeFirstOrThrow();

  return lastGame.GameKickoff;
});

export const getPoolCost = cache(() => getNumericSystemValue("PoolCost"));

export const getSurvivorCost = cache(() => getNumericSystemValue("SurvivorCost"));

export const getSurvivorPrizeAmounts = cache(
  (): Promise<[number, number, number]> => loadPrizes(db, "SurvivorPrizes", "survivor", parseThreePrizes, [0, 0, 0]),
);

export const getSystemYear = cache(() => getNumericSystemValue("YearUpdated"));

export const getWeeklyPrizeAmounts = cache(
  (trx?: Transaction<DB>): Promise<[number, number, number]> =>
    loadPrizes(trx ?? db, "WeeklyPrizes", "weekly", parseThreePrizes, [0, 0, 0]),
);

export const verifySeasonYearForReset = async (): Promise<null | number> => {
  const nextSeasonYear = getCurrentSeasonYear();
  const currentSeasonYear = await getSystemYear();

  if (nextSeasonYear === currentSeasonYear + 1) {
    return nextSeasonYear;
  }

  return null;
};

export const hasSystemValue = async (name: string): Promise<boolean> => {
  const systemValue = await systemValueQuery(db, name).executeTakeFirst();

  return systemValue?.SystemValueValue === "1";
};
