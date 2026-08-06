import { ADMIN_USER } from "@nfl-pool-monorepo/utils/constants";
import type { Transaction } from "kysely";

import type { DB } from "..";
import { db } from "../kysely";
import { getUserPayments } from "../queries/payment";
import { getSurvivorCost } from "../queries/systemValue";
import { unregisterUserForSurvivor } from "./users";

const markUserDead = async (userID: number, week: number, trx?: Transaction<DB>): Promise<void> => {
  await (trx ?? db)
    .updateTable("SurvivorPicks")
    .set({
      SurvivorPickDeleted: new Date(),
      SurvivorPickDeletedBy: ADMIN_USER,
    })
    .where("UserID", "=", userID)
    .where("SurvivorPickWeek", ">", week)
    .executeTakeFirstOrThrow();
};

export const markEmptySurvivorPicksAsDead = async (week: number): Promise<void> => {
  if (week === 1) {
    const users = await db
      .selectFrom("SurvivorPicks")
      .select(["UserID"])
      .where("SurvivorPickWeek", "=", 1)
      .where("TeamID", "is", null)
      .execute();

    console.log(`Found ${users.length} users to try to unregister from survivor pool, verifying if they paid yet...`);

    const survivorCost = await getSurvivorCost();

    for (const user of users) {
      // react-doctor-disable-next-line async-await-in-loop -- kept sequential so each user's unregister runs in its own isolated transaction, one at a time, rather than racing concurrent survivor-pool unregistrations
      const userBalance = await getUserPayments(user.UserID);

      if (userBalance > survivorCost * -1) {
        continue;
      }

      // react-doctor-disable-next-line async-await-in-loop -- kept sequential so each user's unregister runs in its own isolated transaction, one at a time, rather than racing concurrent survivor-pool unregistrations
      await db.transaction().execute(async (trx) => {
        await unregisterUserForSurvivor(trx, user.UserID, ADMIN_USER, true);
      });
      console.log("Unregistered user from survivor pool", user);
    }
  }

  const dead = await db
    .selectFrom("SurvivorPicks")
    .select(["UserID"])
    .where("SurvivorPickWeek", "=", week)
    .where("TeamID", "is", null)
    .execute();

  for (const user of dead) {
    // react-doctor-disable-next-line async-await-in-loop -- kept sequential so survivor eliminations are applied one user at a time rather than racing concurrent writes to SurvivorPicks
    await markUserDead(user.UserID, week);
  }
};

export const markWrongSurvivorPicksAsDead = async (
  week: number,
  losingID: number,
  trx?: Transaction<DB>,
): Promise<void> => {
  const dead = await (trx ?? db)
    .selectFrom("SurvivorPicks")
    .select(["UserID"])
    .where("SurvivorPickWeek", "=", week)
    .where("TeamID", "=", losingID)
    .execute();

  for (const user of dead) {
    // react-doctor-disable-next-line async-await-in-loop -- when trx is set these updates share one transaction connection; mysql2 processes queries on a connection sequentially, so Promise.all here would not run them concurrently
    await markUserDead(user.UserID, week, trx);
  }
};
