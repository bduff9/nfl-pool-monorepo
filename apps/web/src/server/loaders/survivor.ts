import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { cache } from "react";
import "server-only";

import { getCurrentSession } from "./sessions";

export const getIsAliveInSurvivor = cache(async (): Promise<boolean> => {
  const { user } = await getCurrentSession();

  if (!user) {
    throw new Error("Not logged in");
  }

  if (!user.playsSurvivor) {
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
    .where("UserID", "=", user.id)
    .executeTakeFirst();

  if (!myRank) {
    return false;
  }

  return myRank.IsAliveOverall === 1;
});

export const getMySurvivorPickForWeek = cache(async (week: number) => {
  const { user } = await getCurrentSession();

  if (!user) {
    throw new Error("Not logged in");
  }

  return db
    .selectFrom("Teams as T")
    .selectAll()
    .where((eb) =>
      eb(
        "T.TeamID",
        "=",
        eb
          .selectFrom("SurvivorPicks as S")
          .select("TeamID")
          .where("S.SurvivorPickWeek", "=", week)
          .where("S.UserID", "=", user.id),
      ),
    )
    .executeTakeFirst();
});
