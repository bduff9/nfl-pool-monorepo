import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { sql } from "kysely";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/mysql";
import { cache } from "react";
import "server-only";

import { weekSchema } from "@nfl-pool-monorepo/utils/zod";

import { getCurrentSession } from "./sessions";

export const getAllPicksForWeek = cache(async (week: number) => {
  weekSchema.parse(week);

  return db
    .selectFrom("Picks as P")
    .selectAll("P")
    .leftJoin("Games as G", "G.GameID", "P.GameID")
    .select((eb) => [
      jsonObjectFrom(
        eb
          .selectFrom("Teams as T")
          .select(["T.TeamCity", "T.TeamLogo", "T.TeamName"])
          .whereRef("T.TeamID", "=", "P.TeamID"),
      ).as("pickTeam"),
    ])
    .where("G.GameWeek", "=", week)
    .execute();
});

export const getMyWeeklyPicks = cache(async (week: number) => {
  const { user } = await getCurrentSession();

  if (!user) {
    throw new Error("Not logged in");
  }

  weekSchema.parse(week);

  return db
    .selectFrom("Picks as P")
    .selectAll("P")
    .innerJoin("Games as G", "G.GameID", "P.GameID")
    .selectAll("G")
    .select((eb) => [
      jsonObjectFrom(
        eb
          .selectFrom("Teams as T")
          .select(["T.TeamID", "T.TeamCity", "T.TeamLogo", "T.TeamName"])
          .whereRef("T.TeamID", "=", "P.TeamID"),
      ).as("pickTeam"),
      jsonObjectFrom(
        eb
          .selectFrom("Teams as HT")
          .select([
            "HT.TeamCity",
            "HT.TeamID",
            "HT.TeamLogo",
            "HT.TeamName",
            "HT.TeamShortName",
            "HT.TeamPrimaryColor",
            "HT.TeamSecondaryColor",
            "HT.TeamConference",
            "HT.TeamDivision",
            "HT.TeamPassDefenseRank",
            "HT.TeamPassOffenseRank",
            "HT.TeamRushDefenseRank",
            "HT.TeamRushOffenseRank",
          ])
          .select((eb2) => [
            jsonObjectFrom(
              eb2
                .selectFrom("Games as G2")
                .select((eb3) => [
                  sql<number>`SUM(IF(${eb3.ref("G2.WinnerTeamID")} = ${eb3.ref("G.HomeTeamID")}, 1, 0))`.as("wins"),
                  sql<number>`SUM(IF(${eb3.ref("G2.WinnerTeamID")} <> ${eb3.ref("G.HomeTeamID")} AND ${eb3.ref("G2.WinnerTeamID")} IN (${eb3.ref("G2.HomeTeamID")}, ${eb3.ref("G2.VisitorTeamID")}), 1, 0))`.as(
                    "losses",
                  ),
                  sql<number>`SUM(IF(${eb3.ref("G2.WinnerTeamID")} <> ${eb3.ref("G.HomeTeamID")} AND ${eb3.ref("G2.WinnerTeamID")} NOT IN (${eb3.ref("G2.HomeTeamID")}, ${eb3.ref("G2.VisitorTeamID")}), 1, 0))`.as(
                    "ties",
                  ),
                ])
                .where("G2.GameStatus", "=", "Final")
                .where((eb3) =>
                  eb3.or([
                    eb3("G2.HomeTeamID", "=", eb3.ref("G.HomeTeamID")),
                    eb3("G2.VisitorTeamID", "=", eb3.ref("G.HomeTeamID")),
                  ]),
                ),
            ).as("record"),
            jsonArrayFrom(
              eb2
                .selectFrom("Games as G2")
                .select([
                  "G2.GameID",
                  "G2.GameWeek",
                  "G2.HomeTeamID",
                  "G2.VisitorTeamID",
                  "G2.WinnerTeamID",
                  "G2.GameHomeScore",
                  "G2.GameVisitorScore",
                ])
                .innerJoin("Teams as HT2", "HT2.TeamID", "G2.HomeTeamID")
                .select(["HT2.TeamShortName as homeTeamShortName"])
                .innerJoin("Teams as VT2", "VT2.TeamID", "G2.VisitorTeamID")
                .select(["VT2.TeamShortName as visitorTeamShortName"])
                .orderBy("G2.GameWeek", "asc")
                .where("G2.GameStatus", "=", "Final")
                .where((eb3) =>
                  eb3.or([
                    eb3("G2.HomeTeamID", "=", eb3.ref("HT.TeamID")),
                    eb3("G2.VisitorTeamID", "=", eb3.ref("HT.TeamID")),
                  ]),
                ),
            ).as("teamHistory"),
          ])
          .whereRef("HT.TeamID", "=", "G.HomeTeamID"),
      ).as("homeTeam"),
      jsonObjectFrom(
        eb
          .selectFrom("Teams as VT")
          .select([
            "VT.TeamCity",
            "VT.TeamID",
            "VT.TeamLogo",
            "VT.TeamName",
            "VT.TeamShortName",
            "VT.TeamPrimaryColor",
            "VT.TeamSecondaryColor",
            "VT.TeamConference",
            "VT.TeamDivision",
            "VT.TeamPassDefenseRank",
            "VT.TeamPassOffenseRank",
            "VT.TeamRushDefenseRank",
            "VT.TeamRushOffenseRank",
          ])
          .select((eb2) => [
            jsonObjectFrom(
              eb2
                .selectFrom("Games as G2")
                .select((eb3) => [
                  sql<number>`SUM(IF(${eb3.ref("G2.WinnerTeamID")} = ${eb3.ref("G.VisitorTeamID")}, 1, 0))`.as("wins"),
                  sql<number>`SUM(IF(${eb3.ref("G2.WinnerTeamID")} <> ${eb3.ref("G.VisitorTeamID")} AND ${eb3.ref("G2.WinnerTeamID")} IN (${eb3.ref("G2.HomeTeamID")}, ${eb3.ref("G2.VisitorTeamID")}), 1, 0))`.as(
                    "losses",
                  ),
                  sql<number>`SUM(IF(${eb3.ref("G2.WinnerTeamID")} <> ${eb3.ref("G.VisitorTeamID")} AND ${eb3.ref("G2.WinnerTeamID")} NOT IN (${eb3.ref("G2.HomeTeamID")}, ${eb3.ref("G2.VisitorTeamID")}), 1, 0))`.as(
                    "ties",
                  ),
                ])
                .where("G2.GameStatus", "=", "Final")
                .where((eb3) =>
                  eb3.or([
                    eb3("G2.HomeTeamID", "=", eb3.ref("G.VisitorTeamID")),
                    eb3("G2.VisitorTeamID", "=", eb3.ref("G.VisitorTeamID")),
                  ]),
                ),
            ).as("record"),
            jsonArrayFrom(
              eb2
                .selectFrom("Games as G2")
                .select([
                  "G2.GameID",
                  "G2.GameWeek",
                  "G2.HomeTeamID",
                  "G2.VisitorTeamID",
                  "G2.WinnerTeamID",
                  "G2.GameHomeScore",
                  "G2.GameVisitorScore",
                ])
                .innerJoin("Teams as HT2", "HT2.TeamID", "G2.HomeTeamID")
                .select(["HT2.TeamShortName as homeTeamShortName"])
                .innerJoin("Teams as VT2", "VT2.TeamID", "G2.VisitorTeamID")
                .select(["VT2.TeamShortName as visitorTeamShortName"])
                .orderBy("G2.GameWeek", "asc")
                .where("G2.GameStatus", "=", "Final")
                .where((eb3) =>
                  eb3.or([
                    eb3("G2.HomeTeamID", "=", eb3.ref("VT.TeamID")),
                    eb3("G2.VisitorTeamID", "=", eb3.ref("VT.TeamID")),
                  ]),
                ),
            ).as("teamHistory"),
          ])
          .whereRef("VT.TeamID", "=", "G.VisitorTeamID"),
      ).as("visitorTeam"),
      jsonObjectFrom(
        eb
          .selectFrom("Teams as WT")
          .select([
            "WT.TeamCity",
            "WT.TeamID",
            "WT.TeamLogo",
            "WT.TeamName",
            "WT.TeamShortName",
            "WT.TeamPrimaryColor",
            "WT.TeamSecondaryColor",
            "WT.TeamConference",
            "WT.TeamDivision",
            "WT.TeamPassDefenseRank",
            "WT.TeamPassOffenseRank",
            "WT.TeamRushDefenseRank",
            "WT.TeamRushOffenseRank",
          ])
          .select((eb2) => [
            jsonObjectFrom(
              eb2
                .selectFrom("Games as G2")
                .select((eb3) => [
                  sql<number>`SUM(IF(${eb3.ref("G2.WinnerTeamID")} = ${eb3.ref("G.WinnerTeamID")}, 1, 0))`.as("wins"),
                  sql<number>`SUM(IF(${eb3.ref("G2.WinnerTeamID")} <> ${eb3.ref("G.WinnerTeamID")} AND ${eb3.ref("G2.WinnerTeamID")} IN (${eb3.ref("G2.HomeTeamID")}, ${eb3.ref("G2.VisitorTeamID")}), 1, 0))`.as(
                    "losses",
                  ),
                  sql<number>`SUM(IF(${eb3.ref("G2.WinnerTeamID")} <> ${eb3.ref("G.WinnerTeamID")} AND ${eb3.ref("G2.WinnerTeamID")} NOT IN (${eb3.ref("G2.HomeTeamID")}, ${eb3.ref("G2.VisitorTeamID")}), 1, 0))`.as(
                    "ties",
                  ),
                ])
                .where("G2.GameStatus", "=", "Final")
                .where((eb3) =>
                  eb3.or([
                    eb3("G2.HomeTeamID", "=", eb3.ref("G.WinnerTeamID")),
                    eb3("G2.VisitorTeamID", "=", eb3.ref("G.WinnerTeamID")),
                  ]),
                ),
            ).as("record"),
            jsonArrayFrom(
              eb2
                .selectFrom("Games as G2")
                .select([
                  "G2.GameID",
                  "G2.GameWeek",
                  "G2.HomeTeamID",
                  "G2.VisitorTeamID",
                  "G2.WinnerTeamID",
                  "G2.GameHomeScore",
                  "G2.GameVisitorScore",
                ])
                .innerJoin("Teams as HT2", "HT2.TeamID", "G2.HomeTeamID")
                .select(["HT2.TeamShortName as homeTeamShortName"])
                .innerJoin("Teams as VT2", "VT2.TeamID", "G2.VisitorTeamID")
                .select(["VT2.TeamShortName as visitorTeamShortName"])
                .orderBy("G2.GameWeek", "asc")
                .where("G2.GameStatus", "=", "Final")
                .where((eb3) =>
                  eb3.or([
                    eb3("G2.HomeTeamID", "=", eb3.ref("WT.TeamID")),
                    eb3("G2.VisitorTeamID", "=", eb3.ref("WT.TeamID")),
                  ]),
                ),
            ).as("teamHistory"),
          ])
          .whereRef("WT.TeamID", "=", "G.WinnerTeamID"),
      ).as("winnerTeam"),
    ])
    .where("G.GameWeek", "=", week)
    .where("P.UserID", "=", user.id)
    .execute();
});
