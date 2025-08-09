import { randomInt } from "node:crypto";

import type { getDbGameFromApi } from "@nfl-pool-monorepo/api/src/utils";
import { ADMIN_USER } from "@nfl-pool-monorepo/utils/constants";
import type { Selectable } from "kysely";

import type { Users } from "..";
import { db } from "../kysely";

const getLowestUnusedPoint = async (week: number, userID: number): Promise<null | number> => {
  const usedResult = await db
    .selectFrom("Picks as p")
    .innerJoin("Games as g", "g.GameID", "p.GameID")
    .select(["p.PickPoints as points"])
    .where("g.GameWeek", "=", week)
    .where("p.UserID", "=", userID)
    .execute();
  const used = usedResult.map(({ points }) => points).filter((points) => points != null);

  for (let point = 1; point <= usedResult.length; point++) {
    if (used.includes(point)) {
      continue;
    }

    return point;
  }

  return null;
};

const shouldAutoPickHome = (type: Selectable<Users>["UserAutoPickStrategy"]): boolean => {
  if (type === "Home") return true;

  if (type === "Away") return false;

  return randomInt(0, 10) < 5;
};

export const updateMissedPicks = async (game: Awaited<ReturnType<typeof getDbGameFromApi>>): Promise<void> => {
  const missed = await db
    .selectFrom("Picks as p")
    .innerJoin("Users as u", "u.UserID", "p.UserID")
    .innerJoin("Games as g", "g.GameID", "p.GameID")
    .select([
      "p.PickID",
      "p.PickPoints",
      "p.UserID",
      "u.UserAutoPickStrategy",
      "u.UserAutoPicksLeft",
      "g.HomeTeamID",
      "g.VisitorTeamID",
    ])
    .where("p.TeamID", "is", null)
    .where("p.GameID", "=", game.GameID)
    .execute();

  for (const pick of missed) {
    if (pick.PickPoints) {
      continue;
    }

    const lowestPoint = await getLowestUnusedPoint(game.GameWeek, pick.UserID);

    if (lowestPoint === null) {
      console.error("User missed pick but has no picks remaining", { game, pick });

      throw new Error("User missed pick but has no picks remaining");
    }

    await db
      .updateTable("Picks")
      .set({
        PickPoints: lowestPoint,
        PickUpdated: new Date(),
        PickUpdatedBy: ADMIN_USER,
      })
      .where("PickID", "=", pick.PickID)
      .executeTakeFirstOrThrow();

    if (pick.UserAutoPickStrategy && pick.UserAutoPicksLeft > 0) {
      await db
        .updateTable("Users")
        .set({
          UserAutoPicksLeft: pick.UserAutoPicksLeft - 1,
          UserUpdated: new Date(),
          UserUpdatedBy: ADMIN_USER,
        })
        .where("UserID", "=", pick.UserID)
        .executeTakeFirstOrThrow();

      const pickHome = shouldAutoPickHome(pick.UserAutoPickStrategy);

      await db
        .updateTable("Picks")
        .set({
          PickUpdated: new Date(),
          PickUpdatedBy: ADMIN_USER,
          TeamID: pickHome ? pick.HomeTeamID : pick.VisitorTeamID,
        })
        .where("PickID", "=", pick.PickID)
        .executeTakeFirstOrThrow();

      console.log("Auto picked for user", { pick, pickHome });
    } else {
      console.log("Auto assigned points for missed pick", { pick });
    }
  }
};
