import {
  getDbGameFromApi,
  getGameStatusFromAPI,
  parseTeamsFromApi,
  updateTeamData,
} from "@nfl-pool-monorepo/api/src/utils";
import type { ApiMatchup, NFLWeekArray } from "@nfl-pool-monorepo/api/src/zod";
import { ADMIN_USER } from "@nfl-pool-monorepo/utils/constants";
import type { Transaction, UpdateObject } from "kysely";

import type { DB } from "..";
import { db } from "../kysely";
import { validateAPIData } from "../queries/game";
import { getTeamFromDB, getTeamsFromDB } from "../queries/team";
import { markWrongSurvivorPicksAsDead } from "./survivorPick";

export const populateGames = async (trx: Transaction<DB>, newSeason: NFLWeekArray): Promise<void> => {
  const teams = await getTeamsFromDB();

  for (const { matchup: games, week } of newSeason) {
    if (!games) {
      continue;
    }

    console.log(`Week ${week}: ${games.length} games`);

    for (let i = 0; i < games.length; i++) {
      const gameObj = games[i];

      if (!gameObj) {
        console.error(`Game ${i} is missing!`);
        continue;
      }

      // Create and save this game
      const gameNumber = i + 1;
      const gameID = week * 100 + gameNumber;
      const [hTeamData, vTeamData] = parseTeamsFromApi(gameObj.team);
      const homeTeamID = teams[hTeamData.id];
      const visitorTeamID = teams[vTeamData.id];

      if (!homeTeamID || !visitorTeamID) {
        console.error(`Game ${i} has missing team data!`, hTeamData, vTeamData);
        continue;
      }

      await trx
        .insertInto("Games")
        .values({
          GameAdded: new Date(),
          GameAddedBy: ADMIN_USER,
          GameHomeScore: 0,
          GameID: gameID,
          GameKickoff: gameObj.kickoff,
          GameNumber: gameNumber,
          GameStatus: "Pregame",
          GameTimeLeftInSeconds: gameObj.gameSecondsRemaining,
          GameUpdated: new Date(),
          GameUpdatedBy: ADMIN_USER,
          GameVisitorScore: 0,
          GameWeek: week,
          HomeTeamID: homeTeamID,
          VisitorTeamID: visitorTeamID,
        })
        .executeTakeFirstOrThrow();

      // Update home team data
      await updateTeamData(hTeamData.id, hTeamData, week, trx);

      // Update visiting team data
      await updateTeamData(vTeamData.id, vTeamData, week, trx);
    }
  }
};

export const updateDBGame = async (
  game: ApiMatchup,
  dbGame: Awaited<ReturnType<typeof getDbGameFromApi>>,
): ReturnType<typeof getDbGameFromApi> => {
  const [homeTeam, visitingTeam] = parseTeamsFromApi(game.team);
  const homeTeamID = dbGame.HomeTeamID;
  const visitingTeamID = dbGame.VisitorTeamID;
  const apiUpdateIsValid = validateAPIData(game, dbGame);

  if (!apiUpdateIsValid) {
    console.error("Invalid API data found, skipping all DB updates...");

    return dbGame;
  }

  const updatedGame: UpdateObject<DB, "Games", "Games"> = {
    GameHomeScore: homeTeam.score,
    GameStatus: getGameStatusFromAPI(game),
    GameTimeLeftInQuarter: game.quarterTimeRemaining ?? "",
    GameTimeLeftInSeconds: +game.gameSecondsRemaining,
    GameVisitorScore: visitingTeam.score,
  };

  if (homeTeam.hasPossession === "1") {
    updatedGame.GameHasPossession = homeTeamID;
  } else if (visitingTeam.hasPossession === "1") {
    updatedGame.GameHasPossession = visitingTeamID;
  } else {
    updatedGame.GameHasPossession = null;
  }

  if (homeTeam.inRedZone === "1") {
    updatedGame.GameInRedzone = homeTeamID;
  } else if (visitingTeam.inRedZone === "1") {
    updatedGame.GameInRedzone = visitingTeamID;
  } else {
    updatedGame.GameInRedzone = null;
  }

  if (updatedGame.GameStatus === "Final") {
    if (homeTeam.score > visitingTeam.score) {
      updatedGame.WinnerTeamID = homeTeamID;
      await markWrongSurvivorPicksAsDead(dbGame.GameWeek, visitingTeamID);
    } else if (homeTeam.score < visitingTeam.score) {
      updatedGame.WinnerTeamID = visitingTeamID;
      await markWrongSurvivorPicksAsDead(dbGame.GameWeek, homeTeamID);
    } else {
      const tieTeam = await getTeamFromDB("TIE");

      updatedGame.WinnerTeamID = tieTeam.TeamID;
      await markWrongSurvivorPicksAsDead(dbGame.GameWeek, homeTeamID);
      await markWrongSurvivorPicksAsDead(dbGame.GameWeek, visitingTeamID);
    }
  }

  updatedGame.GameUpdated = new Date();
  updatedGame.GameUpdatedBy = ADMIN_USER;
  await db.updateTable("Games").set(updatedGame).where("GameID", "=", dbGame.GameID).executeTakeFirstOrThrow();

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
    .where("g.GameID", "=", dbGame.GameID)
    .executeTakeFirstOrThrow();
};

export const updateSpreads = async (week: number, apiGame: ApiMatchup): Promise<void> => {
  const { kickoff, team } = apiGame;
  const [homeTeam, visitingTeam] = parseTeamsFromApi(team);
  const game = await getDbGameFromApi(week, homeTeam.id, visitingTeam.id);

  await db
    .updateTable("Games")
    .set({
      GameHomeSpread: homeTeam.spread.toString(),
      GameKickoff: kickoff,
      GameUpdated: new Date(),
      GameUpdatedBy: ADMIN_USER,
      GameVisitorSpread: visitingTeam.spread.toString(),
    })
    .where("GameID", "=", game.GameID)
    .executeTakeFirstOrThrow();
};
