import { ADMIN_USER } from "@nfl-pool-monorepo/utils/constants";

import { db } from "../kysely";
import { getUserPayments } from "../queries/payment";
import { getSurvivorCost } from "../queries/systemValue";
import { unregisterUserForSurvivor } from "./users";

const markUserDead = async (userID: number, week: number): Promise<void> => {
  await db
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

    for (const user of users) {
      const userBalance = await getUserPayments(user.UserID);
      const survivorCost = await getSurvivorCost();

      if (userBalance > survivorCost * -1) {
        continue;
      }

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
    await markUserDead(user.UserID, week);
  }
};

export const markWrongSurvivorPicksAsDead = async (week: number, losingID: number): Promise<void> => {
  const dead = await db
    .selectFrom("SurvivorPicks")
    .select(["UserID"])
    .where("SurvivorPickWeek", "=", week)
    .where("TeamID", "=", losingID)
    .execute();

  for (const user of dead) {
    await markUserDead(user.UserID, week);
  }
};
