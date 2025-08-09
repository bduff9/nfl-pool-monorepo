import { db } from "../kysely";

export const getTeamFromDB = async (shortName: string) => {
  return db.selectFrom("Teams").select(["TeamID"]).where("TeamShortName", "=", shortName).executeTakeFirstOrThrow();
};

export const getTeamsFromDB = async (): Promise<Record<string, number>> => {
  const teams = await db.selectFrom("Teams").select(["TeamID", "TeamShortName"]).execute();

  return teams.reduce(
    (acc, { TeamID, TeamShortName }) => {
      acc[TeamShortName] = TeamID;

      return acc;
    },
    {} as Record<string, number>,
  );
};
