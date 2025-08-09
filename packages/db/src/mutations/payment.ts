import { ADMIN_USER } from "@nfl-pool-monorepo/utils/constants";
import { addOrdinal } from "@nfl-pool-monorepo/utils/numbers";
import { sendLockedOutEmail } from "@nfl-pool-monorepo/transactional/emails/lockedOut";
import { sql, type Transaction } from "kysely";

import type { DB } from "..";
import { db as database } from "../kysely";
import { getSurvivorPoolStatus } from "./../queries/survivor";
import {
  getOverallPrizeAmounts,
  getOverallPrizeForLastPlace,
  getPaymentDueWeek,
  getSurvivorPrizeAmounts,
  getWeeklyPrizeAmounts,
} from "../queries/systemValue";
import { getUsersWhoOwe } from "../queries/payment";
import { unregisterUser } from "./users";
import { signOutUserFromAllDevices } from "./session";

const getPrizeAmounts = <T extends Array<number>>(winners: Array<{ Rank: number }>, prizes: T): T => {
  const adjustedPrizes = [...prizes];
  const places = winners.reduce(
    (acc, winner) => {
      acc[winner.Rank] = (acc[winner.Rank] ?? 0) + 1;

      return acc;
    },
    prizes.map(() => 0),
  );

  for (let i = places.length; i--; ) {
    if (i === 0) continue;

    const place = places[i] as number;

    if (place === 0) {
      adjustedPrizes[i - 1] = (adjustedPrizes[i - 1] ?? 0) + (adjustedPrizes[i] ?? 0);
      adjustedPrizes[i] = 0;
    } else {
      adjustedPrizes[i] = Math.round(((adjustedPrizes[i] ?? 0) / place + Number.EPSILON) * 100) / 100;
    }
  }

  return adjustedPrizes as T;
};

export const lockLatePaymentUsers = async (week: number): Promise<void> => {
	const dueWeek = await getPaymentDueWeek();

	if (week < dueWeek) {
		return;
	}

	const payments = await getUsersWhoOwe();

	for (const payment of payments) {
		await unregisterUser(payment.UserID);
		await signOutUserFromAllDevices(payment.UserID);
		await sendLockedOutEmail(payment.UserID, Math.abs(payment.balance), week);
	}
};

export const updateAllPayouts = async (week: number, trx?: Transaction<DB>): Promise<void> => {
  const db = trx ?? database;
  const weeklyPrizes = await getWeeklyPrizeAmounts(trx);

  await db.deleteFrom("Payments").where("PaymentWeek", "is not", null).executeTakeFirstOrThrow();

  for (let i = 1; i <= week; i++) {
    const winners = await db
      .selectFrom("WeeklyMV")
      .select(["Rank", "UserID"])
      .where("Rank", "<", weeklyPrizes.length)
      .where("Week", "=", i)
      .execute();
    const adjustedPrizes = getPrizeAmounts(winners, weeklyPrizes);

    for (const winner of winners) {
      await db
        .insertInto("Payments")
        .values({
          PaymentAddedBy: ADMIN_USER,
          PaymentAmount: adjustedPrizes[winner.Rank] as number,
          PaymentDescription: `${addOrdinal(winner.Rank)} Place`,
          PaymentType: "Prize",
          PaymentUpdatedBy: ADMIN_USER,
          PaymentWeek: i,
          UserID: winner.UserID,
        })
        .executeTakeFirstOrThrow();
    }
  }

  const gamesLeft = await db.selectFrom("Games").select("GameID").where("GameStatus", "!=", "Final").execute();
  const seasonIsOver = gamesLeft.length === 0;

  if (seasonIsOver) {
    await db.deleteFrom("Payments").where("PaymentDescription", "like", "% Overall").executeTakeFirstOrThrow();

    const overallPrizes = await getOverallPrizeAmounts();
    const winners = await db
      .selectFrom("OverallMV")
      .select(["Rank", "UserID"])
      .where("Rank", "<", overallPrizes.length)
      .execute();
    const adjustedPrizes = getPrizeAmounts(winners, overallPrizes);

    for (const winner of winners) {
      await db
        .insertInto("Payments")
        .values({
          PaymentAddedBy: ADMIN_USER,
          PaymentAmount: adjustedPrizes[winner.Rank] as number,
          PaymentDescription: `${addOrdinal(winner.Rank)} Place Overall`,
          PaymentType: "Prize",
          PaymentUpdatedBy: ADMIN_USER,
          PaymentWeek: null,
          UserID: winner.UserID,
        })
        .executeTakeFirstOrThrow();
    }

    const lastPlacePrize = await getOverallPrizeForLastPlace();
    const lastPlacePrizes = [0];
    const lastPlace = await db
      .selectFrom("OverallMV")
      .select(({ ref }) => [sql<number>`max(${ref("Rank")}`.as("Lowest")])
      .where("GamesMissed", "=", 0)
      .executeTakeFirstOrThrow();

    if (lastPlace) {
      lastPlacePrizes[lastPlace.Lowest] = lastPlacePrize;

      const lastPlaceWinners = await db
        .selectFrom("OverallMV")
        .select(["Rank", "UserID"])
        .where("Rank", "=", lastPlace.Lowest)
        .execute();
      const adjustedPrizes = getPrizeAmounts(lastPlaceWinners, lastPlacePrizes);

      for (const winner of lastPlaceWinners) {
        await db
          .insertInto("Payments")
          .values({
            PaymentAddedBy: ADMIN_USER,
            PaymentAmount: adjustedPrizes[winner.Rank] as number,
            PaymentDescription: `Last Place Overall`,
            PaymentType: "Prize",
            PaymentUpdatedBy: ADMIN_USER,
            PaymentWeek: null,
            UserID: winner.UserID,
          })
          .executeTakeFirstOrThrow();
      }
    }
  }

  const { justEnded } = await getSurvivorPoolStatus(week);

  if (justEnded) {
    await db.deleteFrom("Payments").where("PaymentDescription", "like", "% Survivor Pool").executeTakeFirstOrThrow();

    const survivorPrizes = await getSurvivorPrizeAmounts();
    const winners = await db
      .selectFrom("SurvivorMV")
      .select(["Rank", "UserID"])
      .where("Rank", "<", survivorPrizes.length)
      .execute();
    const adjustedPrizes = getPrizeAmounts(winners, survivorPrizes);

    for (const winner of winners) {
      await db
        .insertInto("Payments")
        .values({
          PaymentAddedBy: ADMIN_USER,
          PaymentAmount: adjustedPrizes[winner.Rank] as number,
          PaymentDescription: `${addOrdinal(winner.Rank)} Place Survivor Pool`,
          PaymentType: "Prize",
          PaymentUpdatedBy: ADMIN_USER,
          PaymentWeek: null,
          UserID: winner.UserID,
        })
        .executeTakeFirstOrThrow();
    }
  }
};
