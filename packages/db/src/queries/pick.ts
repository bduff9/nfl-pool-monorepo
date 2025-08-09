import { db } from "../kysely";

export const getLowestUnusedPoint = async (week: number, userId: number): Promise<null | number> => {
  const usedResult = await db
    .selectFrom("Picks as p")
    .select("p.PickPoints as points")
    .innerJoin("Games as g", "g.GameID", "p.GameID")
    .where("p.UserID", "=", userId)
    .where("g.GameWeek", "=", week)
    .execute();
  const used = usedResult.map(({ points }) => points).filter((points) => points !== null);

  for (let point = 1; point <= usedResult.length; point++) {
    if (used.includes(point)) continue;

    return point;
  }

  return null;
};

export const getUserPicksForWeek = (leagueID: number, userID: number, week: number) => {
  return db
    .selectFrom("Picks as p")
    .select(["p.PickID", "p.PickPoints"])
    .innerJoin("Games as g", "g.GameID", "p.GameID")
    .select(["p.PickID", "p.PickPoints"])
    .where("p.UserID", "=", userID)
    .where("g.GameWeek", "=", week)
    .where("p.LeagueID", "=", leagueID)
    .execute();
};

export const hasUserPickedFirstGameForWeek = async (userID: number, week: number): Promise<boolean> => {
  const pick = await db
    .selectFrom("Picks as P")
    .innerJoin("Games as G", "G.GameID", "P.GameID")
    .select(["P.TeamID", "P.PickPoints"])
    .where("P.UserID", "=", userID)
    .where("G.GameWeek", "=", week)
    .where("G.GameNumber", "=", 1)
    .executeTakeFirstOrThrow();

  return !!pick.TeamID && !!pick.PickPoints;
};
