import { type Kysely, sql } from "kysely";

import type { DB } from "..";

export const upcomingSeasonOpenerQuery = (executor: Pick<Kysely<DB>, "selectFrom">) =>
  executor
    .selectFrom("Games")
    .select("GameID")
    .where("GameNumber", "=", 1)
    .where("GameWeek", "=", 1)
    .where("GameKickoff", ">", sql<Date>`CURRENT_TIMESTAMP`);
