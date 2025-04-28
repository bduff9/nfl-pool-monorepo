import { db } from "../kysely";

export const getPublicLeague = () => {
  return db.selectFrom("Leagues").select("LeagueID").where("LeagueName", "=", "public").executeTakeFirstOrThrow();
};
