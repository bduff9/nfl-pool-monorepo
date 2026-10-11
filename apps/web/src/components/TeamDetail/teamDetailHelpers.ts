/*******************************************************************************
 * NFL Confidence Pool FE - the frontend implementation of an NFL confidence pool.
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

import type { getMyWeeklyPicks } from "@/server/loaders/pick";

export type TeamBlockTeam =
  | Awaited<ReturnType<typeof getMyWeeklyPicks>>[number]["homeTeam"]
  | Awaited<ReturnType<typeof getMyWeeklyPicks>>[number]["visitorTeam"];

export type HistoryGame = NonNullable<TeamBlockTeam>["teamHistory"][number];

type HistoryResult = { className: string; text: string };

const orZero = (value: null | number | undefined): number => value ?? 0;

// A missing team renders empty fields, so destructure from an empty partial instead of optional-chaining each read.
export const getTeamFields = (team: TeamBlockTeam): Partial<NonNullable<TeamBlockTeam>> => team ?? {};

type TeamRecord = { losses: null | number; ties: null | number; wins: null | number };

export const getRecordLabel = (record: null | TeamRecord | undefined) =>
  `${orZero(record?.wins)}-${orZero(record?.losses)}-${orZero(record?.ties)}`;

const getSides = (game: HistoryGame, isHome: boolean) => {
  if (isHome) {
    return {
      opponentID: game.VisitorTeamID,
      opponentScore: game.GameVisitorScore,
      opponentShortName: game.visitorTeamShortName,
      ownScore: game.GameHomeScore,
      prefix: "vs",
    };
  }

  return {
    opponentID: game.HomeTeamID,
    opponentScore: game.GameHomeScore,
    opponentShortName: game.homeTeamShortName,
    ownScore: game.GameVisitorScore,
    prefix: "@",
  };
};

const getResult = (won: boolean, lost: boolean): HistoryResult => {
  if (won) return { className: "text-green-500", text: "W" };

  if (lost) return { className: "text-red-600", text: "L" };

  return { className: "", text: "T" };
};

export const getHistoryEntry = (game: HistoryGame, teamID: number) => {
  const sides = getSides(game, game.HomeTeamID === teamID);
  const result = getResult(game.WinnerTeamID === teamID, game.WinnerTeamID === sides.opponentID);

  return {
    opponentScore: sides.opponentScore,
    opponentShortName: sides.opponentShortName,
    ownScore: sides.ownScore,
    prefix: sides.prefix,
    resultClassName: result.className,
    resultText: result.text,
  };
};
