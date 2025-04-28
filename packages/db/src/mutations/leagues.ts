import type { DB, Users } from "@nfl-pool-monorepo/db/src";
import type { Selectable, Transaction } from "kysely";

import { getPublicLeague } from "../queries/league";

export const ensureUserIsInPublicLeague = async (
  trx: Transaction<DB>,
  user: Pick<Selectable<Users>, "UserID" | "UserEmail">,
) => {
  const publicLeague = await getPublicLeague();
  const existing = await trx
    .selectFrom("UserLeagues")
    .select(["UserLeagueID"])
    .where("LeagueID", "=", publicLeague.LeagueID)
    .where("UserID", "=", user.UserID)
    .executeTakeFirst();

  if (existing) {
    return;
  }

  return trx
    .insertInto("UserLeagues")
    .values({
      LeagueID: publicLeague.LeagueID,
      UserID: user.UserID,
      UserLeagueAddedBy: user.UserEmail,
      UserLeagueUpdatedBy: user.UserEmail,
    })
    .executeTakeFirstOrThrow();
};
