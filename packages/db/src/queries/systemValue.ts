import { type } from "arktype";
import { cache } from "react";
import "server-only";

import { db } from "../kysely";

export const getOverallPrizeAmounts = cache(async (): Promise<[number, number, number, number]> => {
  const defaultPrizes: [number, number, number, number] = [0, 0, 0, 0];
  const systemValue = await db
    .selectFrom("SystemValues")
    .select("SystemValueValue")
    .where("SystemValueName", "=", "OverallPrizes")
    .executeTakeFirst();

  if (!systemValue?.SystemValueValue) {
    return defaultPrizes;
  }

  const parsePrizes = type("string.json.parse").to(["number", "number", "number", "number"]);
  const prizes = parsePrizes(systemValue.SystemValueValue);

  if (prizes instanceof type.errors) {
    console.error("Failed to parse overall prize amounts", prizes, systemValue.SystemValueValue);

    return defaultPrizes;
  }

  return prizes;
});

export const getOverallPrizeForLastPlace = cache(async (): Promise<number> => {
  const systemValue = await db
    .selectFrom("SystemValues")
    .select("SystemValueValue")
    .where("SystemValueName", "=", "PoolCost")
    .executeTakeFirst();

  return Number(systemValue?.SystemValueValue ?? "0");
});

export const getPaymentDueWeek = cache(async (): Promise<number> => {
  const systemValue = await db
    .selectFrom("SystemValues")
    .select("SystemValueValue")
    .where("SystemValueName", "=", "PaymentDueWeek")
    .executeTakeFirst();

  return Number(systemValue?.SystemValueValue ?? "0");
});

export const getPaymentDueDate = cache(async (): Promise<Date> => {
  const dueWeek = await getPaymentDueWeek();
  const lastGame = await db
    .selectFrom("Games")
    .select("GameKickoff")
    .where("GameWeek", "=", dueWeek)
    .orderBy("GameKickoff desc")
    .executeTakeFirstOrThrow();

  return lastGame.GameKickoff;
});

export const getPoolCost = cache(async (): Promise<number> => {
  const systemValue = await db
    .selectFrom("SystemValues")
    .select("SystemValueValue")
    .where("SystemValueName", "=", "PoolCost")
    .executeTakeFirst();

  return Number(systemValue?.SystemValueValue ?? "0");
});

export const getSurvivorCost = cache(async (): Promise<number> => {
  const systemValue = await db
    .selectFrom("SystemValues")
    .select("SystemValueValue")
    .where("SystemValueName", "=", "SurvivorCost")
    .executeTakeFirst();

  return Number(systemValue?.SystemValueValue ?? "0");
});

export const getSurvivorPrizeAmounts = cache(async (): Promise<[number, number, number]> => {
  const defaultPrizes: [number, number, number] = [0, 0, 0];
  const systemValue = await db
    .selectFrom("SystemValues")
    .select("SystemValueValue")
    .where("SystemValueName", "=", "SurvivorPrizes")
    .executeTakeFirst();

  if (!systemValue?.SystemValueValue) {
    return defaultPrizes;
  }

  const parsePrizes = type("string.json.parse").to(["number", "number", "number"]);
  const prizes = parsePrizes(systemValue.SystemValueValue);

  if (prizes instanceof type.errors) {
    console.error("Failed to parse survivor prize amounts", prizes, systemValue.SystemValueValue);

    return defaultPrizes;
  }

  return prizes;
});

export const getSystemYear = cache(async (): Promise<number> => {
  const systemValue = await db
    .selectFrom("SystemValues")
    .select("SystemValueValue")
    .where("SystemValueName", "=", "YearUpdated")
    .executeTakeFirst();

  return Number(systemValue?.SystemValueValue ?? "0");
});

export const getWeeklyPrizeAmounts = cache(async (): Promise<[number, number, number]> => {
  const defaultPrizes: [number, number, number] = [0, 0, 0];
  const systemValue = await db
    .selectFrom("SystemValues")
    .select("SystemValueValue")
    .where("SystemValueName", "=", "WeeklyPrizes")
    .executeTakeFirst();

  if (!systemValue?.SystemValueValue) {
    return defaultPrizes;
  }

  const parsePrizes = type("string.json.parse").to(["number", "number", "number"]);
  const prizes = parsePrizes(systemValue.SystemValueValue);

  if (prizes instanceof type.errors) {
    console.error("Failed to parse weekly prize amounts", prizes, systemValue.SystemValueValue);

    return defaultPrizes;
  }

  return prizes;
});
