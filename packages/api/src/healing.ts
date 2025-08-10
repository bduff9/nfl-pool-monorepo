/*******************************************************************************
 * NFL Confidence Pool BE - the backend implementation of an NFL confidence pool.
 * Copyright (C) 2015-present Brian Duffey
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see {http://www.gnu.org/licenses/}.
 * Home: https://asitewithnoname.com/
 */

import type { Games, Picks } from "@nfl-pool-monorepo/db/src";
import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { updateTeamByeWeeks } from "@nfl-pool-monorepo/db/src/mutations/team";
import { findFutureGame, getGamesForWeek } from "@nfl-pool-monorepo/db/src/queries/game";
import { getUserPicksForWeek } from "@nfl-pool-monorepo/db/src/queries/pick";
import { getTeamsFromDB } from "@nfl-pool-monorepo/db/src/queries/team";
import { getAllRegisteredUsers } from "@nfl-pool-monorepo/db/src/queries/user";
import { sendInvalidGamesEmail } from "@nfl-pool-monorepo/transactional/emails/invalidGames";
import { ADMIN_USER, WEEKS_IN_SEASON } from "@nfl-pool-monorepo/utils/constants";
import type { Selectable } from "kysely";

import { parseTeamsFromApi } from "./utils";
import type { ApiMatchup, NFLWeekArray } from "./zod";

type Game = Awaited<ReturnType<typeof getGamesForWeek>>[number];
type PoolPick = Pick<Selectable<Picks>, "PickID" | "PickPoints">;

const movePointDown = async (pick: PoolPick, picks: Array<PoolPick>): Promise<void> => {
  if (pick.PickPoints === null) {
    return;
  }

  const moveTo = pick.PickPoints - 1;
  const foundPick = picks.find(({ PickPoints }) => PickPoints === moveTo);

  if (foundPick) {
    await movePointDown(foundPick, picks);
  }

  await db
    .updateTable("Picks")
    .set({ PickPoints: moveTo, PickUpdatedBy: ADMIN_USER })
    .where("PickID", "=", pick.PickID)
    .executeTakeFirstOrThrow();
};

const fixTooHighPoints = async (picks: Array<PoolPick>): Promise<void> => {
  const highest = picks.reduce(
    (acc, pick) => {
      if (pick.PickPoints === null) return acc;

      if (acc === null || acc.PickPoints === null || acc.PickPoints < pick.PickPoints) {
        return pick;
      }

      return acc;
    },
    null as null | PoolPick,
  );

  if (!highest) {
    return;
  }

  const diff = (highest.PickPoints ?? picks.length) - picks.length;

  for (let i = diff; i--; ) {
    await movePointDown(highest, picks);
  }
};

const movePointUp = async (pick: PoolPick, picks: Array<PoolPick>): Promise<void> => {
  if (pick.PickPoints === null) {
    return;
  }

  const moveTo = pick.PickPoints + 1;
  const foundPick = picks.find(({ PickPoints }) => PickPoints === moveTo);

  if (foundPick) {
    await movePointUp(foundPick, picks);
  }

  await db
    .updateTable("Picks")
    .set({ PickPoints: moveTo, PickUpdatedBy: ADMIN_USER })
    .where("PickID", "=", pick.PickID)
    .executeTakeFirstOrThrow();
};

const fixTooLowPoints = async (picks: Array<PoolPick>): Promise<void> => {
  const lowest = picks.reduce(
    (acc, pick) => {
      if (pick.PickPoints === null) {
        return acc;
      }

      if (acc === null || acc.PickPoints === null || acc.PickPoints > pick.PickPoints) {
        return pick;
      }

      return acc;
    },
    null as null | PoolPick,
  );

  if (!lowest) {
    return;
  }

  const diff = 1 - (lowest.PickPoints ?? 1);

  for (let i = diff; i--; ) {
    await movePointUp(lowest, picks);
  }
};

export const healPicks = async (week: number): Promise<void> => {
  console.log(`Healing picks for week ${week}...`);

  const games = await getGamesForWeek(week);
  const minPoint = 1;
  const maxPoint = games.length;
  const users = await getAllRegisteredUsers();

  for (const { UserID, UserLeagues } of users) {
    for (const { LeagueID } of UserLeagues) {
      const picks = await getUserPicksForWeek(LeagueID, UserID, week);

      const [tooLow, ok, tooHigh] = picks.reduce(
        (acc, { PickPoints }): [number, number, number] => {
          if (PickPoints === null) {
            acc[1]++;
          } else if (PickPoints < minPoint) {
            acc[0]++;
          } else if (PickPoints > maxPoint) {
            acc[2]++;
          } else {
            acc[1]++;
          }

          return acc;
        },
        [0, 0, 0],
      );

      console.log(`User's picks counted`, { ok, tooHigh, tooLow });

      if (tooHigh > 0) await fixTooHighPoints(picks);

      if (tooLow > 0) await fixTooLowPoints(picks);
    }
  }

  console.log(`Finished healing picks for week ${week}!`);
};

const getNextGameNumber = async (gameWeek: number): Promise<number> => {
  const lastGame = await db
    .selectFrom("Games")
    .select(["GameNumber"])
    .where("GameWeek", "=", gameWeek)
    .orderBy("GameNumber", "desc")
    .executeTakeFirstOrThrow();

  return lastGame.GameNumber + 1;
};

const redoGameNumbers = async (gameWeek: number): Promise<void> => {
  const games = await db
    .selectFrom("Games")
    .select(["GameID", "GameNumber"])
    .where("GameWeek", "=", gameWeek)
    .orderBy("GameNumber", "asc")
    .execute();
  let nextOpen = await getNextGameNumber(gameWeek);

  for (let i = 0; i < games.length; i++) {
    const expectedGame = i + 1;
    const game = games[i];

    if (!game || game.GameNumber === expectedGame) {
      continue;
    }

    const foundGame = games.find(({ GameNumber }) => GameNumber === expectedGame);

    if (foundGame) {
      await db
        .updateTable("Games")
        .set({ GameNumber: nextOpen++, GameUpdatedBy: ADMIN_USER })
        .where("GameID", "=", foundGame.GameID)
        .executeTakeFirstOrThrow();
    } else {
      nextOpen--;
    }

    await db
      .updateTable("Games")
      .set({ GameNumber: expectedGame, GameUpdatedBy: ADMIN_USER })
      .where("GameID", "=", game.GameID)
      .executeTakeFirstOrThrow();
  }
};

const updateKickoff = async (
  game: Pick<Selectable<Games>, "GameID" | "GameWeek" | "GameNumber">,
  week: number,
  newKickoff: Date,
): Promise<void> => {
  const gameNumber = game.GameWeek === week ? game.GameNumber : await getNextGameNumber(week);

  await db
    .updateTable("Games")
    .set({
      GameKickoff: newKickoff,
      GameNumber: gameNumber,
      GameUpdatedBy: ADMIN_USER,
      GameWeek: week,
    })
    .where("GameID", "=", game.GameID)
    .executeTakeFirstOrThrow();
};

const updateGameMeta = async (
  game: Pick<Selectable<Games>, "GameID" | "GameWeek" | "GameNumber">,
  week: number,
  kickoff: Date,
): Promise<void> => {
  const oldWeek = game.GameWeek;

  await updateKickoff(game, week, kickoff);
  await redoGameNumbers(week);
  await redoGameNumbers(oldWeek);
};

const findFutureAPIGame = (allAPIWeeks: NFLWeekArray, gameToFind: Game): [number, null | ApiMatchup] => {
  for (let i = 0; i < allAPIWeeks.length; i++) {
    const apiWeek = allAPIWeeks[i];

    if (!apiWeek) {
      continue;
    }

    const gameWeek = gameToFind.GameWeek;
    const week = +apiWeek.week;

    if (week <= gameWeek) {
      continue;
    }

    if (!apiWeek.matchup) {
      continue;
    }

    const found = apiWeek.matchup.find(({ team }) =>
      team.every(
        (team) =>
          (team.isHome === "1" && team.id === gameToFind.homeTeam?.TeamShortName) ||
          (team.isHome === "0" && team.id === gameToFind.visitorTeam?.TeamShortName),
      ),
    );

    if (found) return [week, found];
  }

  return [WEEKS_IN_SEASON, null];
};

export const healWeek = async (week: number, allAPIWeeks: NFLWeekArray): Promise<void> => {
  console.log(`Healing games for week ${week}...`);

  const currentAPIWeek = allAPIWeeks.find(({ week: w }) => +w === week);
  const currentDBWeek = await getGamesForWeek(week);
  const validDBGames: Array<Game> = [];
  const invalidDBGames: Array<Game> = [];
  const validAPIGames: Array<ApiMatchup> = [];
  const invalidAPIGames: Array<ApiMatchup> = [];

  if (!currentAPIWeek || !currentAPIWeek.matchup) return;

  const apiGames = currentAPIWeek.matchup;
  const teams = await getTeamsFromDB();

  for (let i = apiGames.length; i--; ) {
    const game = apiGames[i];

    if (!game) {
      continue;
    }

    const [homeTeam, visitingTeam] = parseTeamsFromApi(game.team);
    const apiHomeTeamID = teams[homeTeam.id];
    const apiVisitorTeamID = teams[visitingTeam.id];
    const gameIndex = currentDBWeek.findIndex(
      ({ homeTeam, visitorTeam }) => homeTeam?.TeamID === apiHomeTeamID && visitorTeam?.TeamID === apiVisitorTeamID,
    );

    if (gameIndex > -1) {
      const dbGame = currentDBWeek[gameIndex];

      if (dbGame) {
        if (game.kickoff.toISOString() !== dbGame.GameKickoff.toISOString()) {
          await updateGameMeta(dbGame, week, game.kickoff);
        }

        validAPIGames.push(game);
        apiGames.splice(i, 1);
        validDBGames.push(dbGame);
        currentDBWeek.splice(gameIndex, 1);
      }
    } else if (apiHomeTeamID && apiVisitorTeamID) {
      try {
        const futureGame = await findFutureGame(apiHomeTeamID, apiVisitorTeamID, week);
        const futureWeek = futureGame.GameWeek;

        await updateGameMeta(futureGame, week, game.kickoff);
        await healPicks(futureWeek);
        await healPicks(week);
      } catch (error) {
        console.error("Future game not found: ", error);
        invalidAPIGames.push(game);
        apiGames.splice(i, 1);
      }
    }
  }

  for (let i = currentDBWeek.length; i--; ) {
    const game = currentDBWeek[i];

    if (!game) {
      continue;
    }

    const [foundWeek, foundAPIGame] = findFutureAPIGame(allAPIWeeks, game);

    if (foundAPIGame) {
      await updateGameMeta(game, foundWeek, foundAPIGame.kickoff);
      await healPicks(week);
      await healPicks(foundWeek);
    } else {
      invalidDBGames.push(game);
    }

    currentDBWeek.splice(i, 1);
  }

  if (invalidAPIGames.length > 0 || invalidDBGames.length > 0) {
    await sendInvalidGamesEmail(week, invalidAPIGames, invalidDBGames);
  }

  await updateTeamByeWeeks(week);

  console.log(`Finished healing games for week ${week}`);
};
