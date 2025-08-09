import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { cache } from "react";
import "server-only";

import { isAliveInSurvivor } from "@nfl-pool-monorepo/db/src/queries/survivor";

import { getCurrentSession } from "./sessions";

export const getIsAliveInSurvivor = cache(async (): Promise<boolean> => {
  const { user } = await getCurrentSession();

  if (!user) {
    throw new Error("Not logged in");
  }

  if (!user.playsSurvivor) {
    return false;
  }

  return isAliveInSurvivor(user.id);
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

export const getMySurvivorPicks = cache(async () => {
  const { user } = await getCurrentSession();

  if (!user) {
    throw new Error("Not logged in");
  }

  return db
    .selectFrom("SurvivorPicks")
    .select(["SurvivorPickWeek", "TeamID"])
    .where("UserID", "=", user.id)
    .orderBy("SurvivorPickWeek", "asc")
    .execute();
});
