import { db } from "../kysely";

export const hasUserSubmittedPicksForWeek = async (userID: number, tiebreakerWeek: number): Promise<boolean> => {
  const tiebreaker = await db
    .selectFrom("Tiebreakers")
    .select("TiebreakerHasSubmitted")
    .where("TiebreakerWeek", "=", tiebreakerWeek)
    .where("UserID", "=", userID)
    .executeTakeFirstOrThrow();

  return tiebreaker.TiebreakerHasSubmitted === 1;
};
