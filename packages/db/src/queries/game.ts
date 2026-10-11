import { weekSchema } from "@nfl-pool-monorepo/utils/validation";
import { type } from "arktype";
import { sql } from "kysely";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/mysql";

import { db } from "../kysely";
import { unfinishedGamesQuery } from "./gameHelpers";

export const getDbGameFromApi = (week: number, homeTeamId: string, visitingTeamId: string) => {
  return db
    .selectFrom("Games as g")
    .innerJoin("Teams as ht", "g.HomeTeamID", "ht.TeamID")
    .innerJoin("Teams as vt", "g.VisitorTeamID", "vt.TeamID")
    .select([
      "g.GameID",
      "g.GameWeek",
      "g.GameNumber",
      "g.GameStatus",
      "g.HomeTeamID",
      "g.VisitorTeamID",
      "g.GameHomeScore",
      "g.GameVisitorScore",
      "g.GameTimeLeftInSeconds",
    ])
    .where("g.GameWeek", "=", week)
    .where("ht.TeamShortName", "=", homeTeamId)
    .where("vt.TeamShortName", "=", visitingTeamId)
    .executeTakeFirstOrThrow();
};

export const checkDBIfUpdatesNeeded = async (week: number): Promise<boolean> => {
  const result = await unfinishedGamesQuery(db, week)
    .where("GameKickoff", "<=", sql<Date>`CURRENT_TIMESTAMP`)
    .execute();

  return result.length > 0;
};

export const hasUnfinishedGames = async (week: number): Promise<boolean> => {
  const result = await unfinishedGamesQuery(db, week).execute();

  return result.length > 0;
};

export const findFutureGame = (homeTeamID: number, visitorTeamID: number, week: number) => {
  return db
    .selectFrom("Games")
    .select(["GameID", "GameWeek", "GameNumber", "GameKickoff"])
    .where("HomeTeamID", "=", homeTeamID)
    .where("VisitorTeamID", "=", visitorTeamID)
    .where("GameWeek", ">", week)
    .executeTakeFirstOrThrow();
};

export const getCurrentWeekInProgress = async (): Promise<number | null> => {
  const game = await db
    .selectFrom("Games")
    .select("GameWeek")
    .where("GameNumber", "=", 1)
    .where("GameKickoff", "<", sql<Date>`CURRENT_TIMESTAMP`)
    .orderBy("GameKickoff", "desc")
    .executeTakeFirst();

  return game?.GameWeek ?? null;
};

export const getGamesForWeek = async (week: number) => {
  const result = weekSchema(week);

  if (result instanceof type.errors) {
    console.error(`Invalid week: ${week}`);

    return [];
  }

  return db
    .selectFrom("Games as G")
    .selectAll("G")
    .select((eb) => [
      jsonObjectFrom(
        eb
          .selectFrom("Teams as HT")
          .select([
            "HT.TeamCity",
            "HT.TeamID",
            "HT.TeamLogo",
            "HT.TeamShortName",
            "HT.TeamName",
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
            "VT.TeamShortName",
            "VT.TeamName",
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
            "WT.TeamShortName",
            "WT.TeamName",
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
    .orderBy("G.GameKickoff", "asc")
    .orderBy("G.GameID", "asc")
    .execute();
};

export const getHoursToWeekStart = async (week: number): Promise<number> => {
  const result = await db
    .selectFrom("Games")
    .select(({ ref }) =>
      sql<string>`TIMESTAMPDIFF(HOUR, CURRENT_TIMESTAMP, ${ref("GameKickoff")})`.as("hoursToKickoff"),
    )
    .where("GameWeek", "=", week)
    .orderBy("GameKickoff", "asc")
    .limit(1)
    .executeTakeFirstOrThrow();

  return +result.hoursToKickoff;
};
