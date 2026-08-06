import type { Selectable, Transaction } from "kysely";

import type { DB, Users } from "../index";
import { getPublicLeague } from "../queries/league";
import { getSystemYear } from "../queries/systemValue";

export const insertUserHistoryRecord = async (trx: Transaction<DB>, user: Pick<Selectable<Users>, "UserID">) => {
  const [publicLeague, year] = await Promise.all([getPublicLeague(), getSystemYear()]);

  return trx
    .insertInto("UserHistory")
    .values({
      LeagueID: publicLeague.LeagueID,
      UserHistoryYear: year,
      UserID: user.UserID,
    })
    .executeTakeFirstOrThrow();
};
