import { type getDbGameFromApi, getGameStatusFromAPI, parseTeamsFromApi } from "@nfl-pool-monorepo/api/src/utils";
import type { ApiMatchup } from "@nfl-pool-monorepo/api/src/zod";
import { weekSchema } from "@nfl-pool-monorepo/utils/zod";
import { differenceInHours } from "date-fns";
import { sql } from "kysely";
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/mysql";

import { db } from "../kysely";

export const checkDBIfUpdatesNeeded = async (week: number): Promise<boolean> => {
  const result = await db
    .selectFrom("Games")
    .select("GameID")
    .where("GameWeek", "=", week)
    .where("GameStatus", "<>", "Final")
    .where("GameKickoff", "<=", sql<Date>`CURRENT_TIMESTAMP`)
    .execute();

  return result.length > 0;
};

export const findFutureGame = (homeTeamID: number, visitorTeamID: number, week: number) => {
  return db
    .selectFrom("Games")
    .select(["GameID", "GameWeek", "GameNumber"])
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
    .orderBy("GameKickoff desc")
    .executeTakeFirst();

  return game?.GameWeek ?? null;
};

export const getGamesForWeek = async (week: number) => {
  const result = weekSchema.safeParse(week);

  if (!result.success) {
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

export const validateAPIData = (game: ApiMatchup, dbGame: Awaited<ReturnType<typeof getDbGameFromApi>>): boolean => {
  const QUARTER_ORDER = [
    "Pregame",
    "1st Quarter",
    "2nd Quarter",
    "Half Time",
    "3rd Quarter",
    "4th Quarter",
    "Overtime",
    "Final",
    "Invalid",
  ] as const;
  const HOURS_TO_WAIT = 10;
  const kickoff = game.kickoff;
  const hoursSinceKickoff = differenceInHours(new Date(), kickoff);
  const [homeTeam, visitingTeam] = parseTeamsFromApi(game.team);

  if (hoursSinceKickoff >= HOURS_TO_WAIT) {
    console.log("Game is outside of waiting period, skip validation...", {
      HOURS_TO_WAIT,
      homeTeam,
      hoursSinceKickoff,
      kickoff,
      visitingTeam,
    });

    return true;
  }

  const homeScoreDB = dbGame.GameHomeScore;
  const homeScoreAPI = +homeTeam.score;

  if (homeScoreAPI < homeScoreDB) {
    console.error("Home score is less than what we had previously: ", {
      homeScoreAPI,
      homeScoreDB,
      homeTeam,
    });

    return false;
  }

  console.log("Home score from API seems valid: ", {
    homeScoreAPI,
    homeScoreDB,
    homeTeam,
  });

  const visitorScoreDB = dbGame.GameVisitorScore;
  const visitorScoreAPI = +visitingTeam.score;

  if (visitorScoreAPI < visitorScoreDB) {
    console.error("Visitor score is less than what we had previously: ", {
      visitingTeam,
      visitorScoreAPI,
      visitorScoreDB,
    });

    return false;
  }

  console.log("Visitor score from API seems valid: ", {
    visitingTeam,
    visitorScoreAPI,
    visitorScoreDB,
  });

  const quarterDB = dbGame.GameStatus;
  const quarterAPI = getGameStatusFromAPI(game);

  if (quarterAPI === "Final" && homeScoreAPI === visitorScoreAPI) {
    console.error(`End score is tied at ${homeScoreAPI}-${visitorScoreAPI}, mistake? `, {
      HOURS_TO_WAIT,
      homeScoreAPI,
      hoursSinceKickoff,
      kickoff,
      quarterAPI,
      visitorScoreAPI,
    });

    return false;
  }

  const quarterIndexDB = QUARTER_ORDER.indexOf(quarterDB);
  const quarterIndexAPI = QUARTER_ORDER.indexOf(quarterAPI);

  if (quarterIndexAPI === quarterIndexDB) {
    const timeLeftDB = dbGame.GameTimeLeftInSeconds;
    const timeLeftAPI = +game.gameSecondsRemaining;

    if (timeLeftAPI > timeLeftDB) {
      console.error("Time left is greater in API than what we had in DB: ", {
        quarterAPI,
        quarterDB,
        timeLeftAPI,
        timeLeftDB,
      });

      return false;
    }

    console.log("Time left from API seems valid: ", {
      quarterAPI,
      quarterDB,
      timeLeftAPI,
      timeLeftDB,
    });
  } else if (quarterIndexAPI < quarterIndexDB) {
    console.error("Quarter from API is earlier than what we have in DB: ", {
      QUARTER_ORDER,
      quarterAPI,
      quarterDB,
      quarterIndexAPI,
      quarterIndexDB,
    });

    return false;
  }

  console.log("Quarter from API seems valid: ", {
    QUARTER_ORDER,
    quarterAPI,
    quarterDB,
    quarterIndexAPI,
    quarterIndexDB,
  });

  return true;
};
