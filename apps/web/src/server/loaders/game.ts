import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { jsonObjectFrom } from "kysely/helpers/mysql";
import { cache } from "react";
import "server-only";

import { getCurrentSession } from "./sessions";

import { weekSchema } from "@/lib/zod";

export const getGamesForWeek = cache(async (week: number) => {
  const { user } = await getCurrentSession();

  if (!user) {
    throw new Error("Not logged in");
  }

  weekSchema.parse(week);

  return db
    .selectFrom("Games as G")
    .selectAll("G")
    .select((eb) => [
      jsonObjectFrom(
        eb
          .selectFrom("Teams as HT")
          .select(["HT.TeamCity", "HT.TeamLogo", "HT.TeamName", "HT.TeamShortName"])
          .whereRef("HT.TeamID", "=", "G.HomeTeamID"),
      ).as("homeTeam"),
      jsonObjectFrom(
        eb
          .selectFrom("Teams as VT")
          .select(["VT.TeamCity", "VT.TeamLogo", "VT.TeamName", "VT.TeamShortName"])
          .whereRef("VT.TeamID", "=", "G.VisitorTeamID"),
      ).as("visitorTeam"),
      jsonObjectFrom(
        eb
          .selectFrom("Teams as WT")
          .select(["WT.TeamCity", "WT.TeamLogo", "WT.TeamName", "WT.TeamShortName"])
          .whereRef("WT.TeamID", "=", "G.WinnerTeamID"),
      ).as("winnerTeam"),
    ])
    .where("G.GameWeek", "=", week)
    .execute();
});
