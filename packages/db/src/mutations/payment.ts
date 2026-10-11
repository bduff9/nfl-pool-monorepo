import { ADMIN_USER } from "@nfl-pool-monorepo/utils/constants";
import { addOrdinal } from "@nfl-pool-monorepo/utils/numbers";
import { sql, type Transaction } from "kysely";

import type { DB } from "..";
import { db as database } from "../kysely";
import { getSurvivorPoolStatus } from "./../queries/survivor";
import {
  getOverallPrizeAmounts,
  getOverallPrizeForLastPlace,
  getSurvivorPrizeAmounts,
  getWeeklyPrizeAmounts,
} from "../queries/systemValue";
import { getPrizeAmounts } from "./payoutMath";

type Winner = { Rank: number; UserID: number };

const insertPrizePayments = async (
  db: Transaction<DB>,
  winners: Array<Winner>,
  adjustedPrizes: Array<number>,
  describe: (rank: number) => string,
  week: number | null,
): Promise<void> => {
  for (const winner of winners) {
    // react-doctor-disable-next-line async-await-in-loop -- these inserts share one transaction connection (trx); mysql2 processes queries on a connection sequentially, so Promise.all here would not run them concurrently
    await db
      .insertInto("Payments")
      .values({
        PaymentAddedBy: ADMIN_USER,
        PaymentAmount: adjustedPrizes[winner.Rank] ?? 0,
        PaymentDescription: describe(winner.Rank),
        PaymentType: "Prize",
        PaymentUpdatedBy: ADMIN_USER,
        PaymentWeek: week,
        UserID: winner.UserID,
      })
      .executeTakeFirstOrThrow();
  }
};

const payWeeklyPrizes = async (db: Transaction<DB>, week: number): Promise<void> => {
  const weeklyPrizes = await getWeeklyPrizeAmounts(db);

  await db.deleteFrom("Payments").where("PaymentWeek", "is not", null).executeTakeFirstOrThrow();

  for (let i = 1; i <= week; i++) {
    const winners = await db
      .selectFrom("WeeklyMV")
      .select(["Rank", "UserID"])
      .where("Rank", "<", weeklyPrizes.length)
      .where("Week", "=", i)
      .execute();

    await insertPrizePayments(
      db,
      winners,
      getPrizeAmounts(winners, weeklyPrizes),
      (rank) => `${addOrdinal(rank)} Place`,
      i,
    );
  }
};

const payLastPlacePrize = async (db: Transaction<DB>): Promise<void> => {
  const lastPlacePrize = await getOverallPrizeForLastPlace();
  const lastPlacePrizes = [0];
  const lastPlace = await db
    .selectFrom("OverallMV")
    .select(({ ref }) => [sql<number>`max(${ref("Rank")})`.as("Lowest")])
    .where("GamesMissed", "=", 0)
    .executeTakeFirstOrThrow();

  if (!lastPlace) return;

  lastPlacePrizes[lastPlace.Lowest] = lastPlacePrize;

  const lastPlaceWinners = await db
    .selectFrom("OverallMV")
    .select(["Rank", "UserID"])
    .where("Rank", "=", lastPlace.Lowest)
    .execute();

  await insertPrizePayments(
    db,
    lastPlaceWinners,
    getPrizeAmounts(lastPlaceWinners, lastPlacePrizes),
    () => `Last Place Overall`,
    null,
  );
};

const payOverallPrizes = async (db: Transaction<DB>): Promise<void> => {
  await db.deleteFrom("Payments").where("PaymentDescription", "like", "% Overall").executeTakeFirstOrThrow();

  const overallPrizes = await getOverallPrizeAmounts();
  const winners = await db
    .selectFrom("OverallMV")
    .select(["Rank", "UserID"])
    .where("Rank", "<", overallPrizes.length)
    .execute();

  await insertPrizePayments(
    db,
    winners,
    getPrizeAmounts(winners, overallPrizes),
    (rank) => `${addOrdinal(rank)} Place Overall`,
    null,
  );
  await payLastPlacePrize(db);
};

const paySurvivorPrizes = async (db: Transaction<DB>): Promise<void> => {
  await db.deleteFrom("Payments").where("PaymentDescription", "like", "% Survivor Pool").executeTakeFirstOrThrow();

  const survivorPrizes = await getSurvivorPrizeAmounts();
  const winners = await db
    .selectFrom("SurvivorMV")
    .select(["Rank", "UserID"])
    .where("Rank", "<", survivorPrizes.length)
    .execute();

  await insertPrizePayments(
    db,
    winners,
    getPrizeAmounts(winners, survivorPrizes),
    (rank) => `${addOrdinal(rank)} Place Survivor Pool`,
    null,
  );
};

export const updateAllPayouts = async (week: number, trx?: Transaction<DB>): Promise<void> => {
  if (!trx) {
    await database.transaction().execute((newTrx) => updateAllPayouts(week, newTrx));

    return;
  }

  await payWeeklyPrizes(trx, week);

  const gamesLeft = await trx.selectFrom("Games").select("GameID").where("GameStatus", "!=", "Final").execute();
  const seasonIsOver = gamesLeft.length === 0;

  if (seasonIsOver) {
    await payOverallPrizes(trx);
  }

  const { justEnded } = await getSurvivorPoolStatus(week);

  if (justEnded) {
    await paySurvivorPrizes(trx);
  }
};
