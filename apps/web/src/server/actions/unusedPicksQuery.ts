import type { DB } from "@nfl-pool-monorepo/db/src";
import { type Kysely, sql } from "kysely";

export const unusedPicksCountQuery = (
  executor: Pick<Kysely<DB>, "selectFrom">,
  userId: number,
  week: number,
  unused: number[] | undefined,
) => {
  const query = executor
    .selectFrom("Picks as P")
    .select([sql<number>`COUNT(*)`.as("count")])
    .innerJoin("Games as G", "G.GameID", "P.GameID")
    .where("G.GameWeek", "=", week)
    .where("P.UserID", "=", userId);

  return !unused || unused.length === 0
    ? query.where("P.PickPoints", "is", null)
    : query.where("P.PickPoints", "in", unused);
};
