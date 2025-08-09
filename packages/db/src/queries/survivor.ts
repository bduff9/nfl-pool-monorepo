import type { Transaction } from "kysely";

import type { DB } from "..";
import { db as database, db } from "../kysely";

export const getSurvivorPoolStatus = async (week: number, trx?: Transaction<DB>) => {
  const db = trx ?? database;
  const winners = await db
    .selectFrom("SurvivorMV as smv")
    .innerJoin("Users as u", "smv.UserID", "u.UserID")
    .select(["smv.Rank", "smv.WeeksAlive", "smv.IsAliveOverall", "u.UserFirstName", "u.UserLastName"])
    .where("Rank", "=", 1)
    .execute();

  const gamesLeft = await db
    .selectFrom("Games")
    .select(({ fn }) => [fn.countAll<number>().as("count")])
    .where("GameStatus", "!=", "Final")
    .executeTakeFirstOrThrow();
  const seasonIsOver = gamesLeft.count === 0;
  const winnersAreAlive = winners.every((winner) => winner.IsAliveOverall === 1);
  const ended = seasonIsOver || winners.length <= 1 || !winnersAreAlive;

  if (ended) {
    let justEnded = winnersAreAlive && seasonIsOver;

    if (!justEnded) {
      justEnded = !winnersAreAlive && winners.every((winner) => winner.WeeksAlive === week);
    }

    if (!justEnded) {
      const secondPlace = await db
        .selectFrom("SurvivorMV")
        .select(["Rank", "UserID", "WeeksAlive", "IsAliveOverall"])
        .where("Rank", "=", 2)
        .execute();

      justEnded = winnersAreAlive && secondPlace.every((user) => user.WeeksAlive === week);
    }

    return { ended, justEnded, winners } as const;
  }

  return { ended, justEnded: false, stillAlive: winners } as const;
};

export const hasUserSubmittedSurvivorPickForWeek = async (
  userId: number,
  survivorPickWeek: number,
): Promise<boolean> => {
  const isAlive = await isAliveInSurvivor(userId);

  if (!isAlive) return true;

  const survivorPick = await db
    .selectFrom("SurvivorPicks")
    .select(["GameID", "TeamID"])
    .where("UserID", "=", userId)
    .where("SurvivorPickWeek", "=", survivorPickWeek)
    .executeTakeFirstOrThrow();

  return !!survivorPick.GameID && !!survivorPick.TeamID;
};

export const isAliveInSurvivor = async (userId: number): Promise<boolean> => {
  const user = await db
    .selectFrom("Users")
    .select("UserPlaysSurvivor")
    .where("UserID", "=", userId)
    .executeTakeFirstOrThrow();

  if (user.UserPlaysSurvivor !== 1) {
    return false;
  }

  const { count } = await db
    .selectFrom("SurvivorMV")
    .select(({ fn }) => [fn.countAll<number>().as("count")])
    .executeTakeFirstOrThrow();

  if (count === 0) {
    return true;
  }

  const myRank = await db
    .selectFrom("SurvivorMV")
    .select("IsAliveOverall")
    .where("UserID", "=", userId)
    .executeTakeFirst();

  if (!myRank) {
    return false;
  }

  return myRank.IsAliveOverall === 1;
};
