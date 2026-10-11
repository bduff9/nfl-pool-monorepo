import type { Kysely } from "kysely";

import type { DB } from "..";

export const unfinishedGamesQuery = (executor: Pick<Kysely<DB>, "selectFrom">, week: number) =>
  executor.selectFrom("Games").select("GameID").where("GameWeek", "=", week).where("GameStatus", "<>", "Final");
