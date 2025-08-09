import type { DB, Users } from "@nfl-pool-monorepo/db/src";
import type { Selectable, Transaction } from "kysely";

import { getPublicLeague } from "../queries/league";
import { getSystemYear } from "../queries/systemValue";

export const insertUserHistoryRecord = async (trx: Transaction<DB>, user: Pick<Selectable<Users>, "UserID">) => {
  const publicLeague = await getPublicLeague();
  const year = await getSystemYear();

  return trx
    .insertInto("UserHistory")
    .values({
      LeagueID: publicLeague.LeagueID,
      UserHistoryYear: year,
      UserID: user.UserID,
    })
    .executeTakeFirstOrThrow();
};
