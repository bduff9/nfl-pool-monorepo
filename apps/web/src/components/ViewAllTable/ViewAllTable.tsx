"use client";

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

import "client-only";

import type { getGamesForWeek } from "@nfl-pool-monorepo/db/src/queries/game";
import { Skeleton } from "@nfl-pool-monorepo/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nfl-pool-monorepo/ui/components/table";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import Image from "next/image";
import type { FC } from "react";

import type { getAllPicksForWeek } from "@/server/loaders/pick";
import type { getWeeklyRankings } from "@/server/loaders/weeklyMv";

type Props = {
  currentUserId: number;
  games: Record<number, Awaited<ReturnType<typeof getGamesForWeek>>[number]>;
  picks: Awaited<ReturnType<typeof getAllPicksForWeek>>;
  ranks: Awaited<ReturnType<typeof getWeeklyRankings>>;
};

// fallow-ignore-next-line complexity -- added consensus aggregation over picks; single-purpose helper inlined in component
const getPoolPercentage = (
  pickCountsByGameTeam: Map<string, number>,
  totalPicksByGame: Map<number, number>,
  gameID: number,
  teamID: null | number,
): number | null => {
  if (!teamID) {
    return null;
  }

  const total = totalPicksByGame.get(gameID);
  const count = pickCountsByGameTeam.get(`${gameID}:${teamID}`);

  if (!total || !count) {
    return null;
  }

  return Math.round((count / total) * 100);
};

// fallow-ignore-next-line complexity -- aggregation loop plus row/cell render helpers; row rendering extracted to named functions
const ViewAllTable: FC<Props> = ({ currentUserId, games, picks, ranks }) => {
  // Share of the pool (users with a pick on the game) that picked each team, per game.
  const pickCountsByGameTeam = new Map<string, number>();
  const totalPicksByGame = new Map<number, number>();

  for (const pick of picks) {
    if (!pick.TeamID) {
      continue;
    }

    const key = `${pick.GameID}:${pick.TeamID}`;

    pickCountsByGameTeam.set(key, (pickCountsByGameTeam.get(key) ?? 0) + 1);
    totalPicksByGame.set(pick.GameID, (totalPicksByGame.get(pick.GameID) ?? 0) + 1);
  }

  const getPercentage = (gameID: number, teamID: null | number): number | null =>
    getPoolPercentage(pickCountsByGameTeam, totalPicksByGame, gameID, teamID);

  // fallow-ignore-next-line complexity -- single pick cell; CRAP reflects missing component-test coverage
  const renderPickCell = (pick: Awaited<ReturnType<typeof getAllPicksForWeek>>[number]) => {
    const game = games[pick.GameID];
    const poolPercentage = getPercentage(pick.GameID, pick.TeamID);

    if (!game) {
      return (
        <TableCell className="text-center" key={`td-skeleton-for-missing-game-${pick.GameID}`}>
          <Skeleton className="size-15" />
          <Skeleton className="size-5" />
        </TableCell>
      );
    }

    return (
      <TableCell
        className={cn(
          "text-center min-w-15",
          game.WinnerTeamID && pick.TeamID === game.WinnerTeamID && "bg-green-300",
          game.WinnerTeamID && pick.TeamID !== game.WinnerTeamID && "bg-red-300",
        )}
        key={`pick-${pick.PickID}`}
      >
        {pick.pickTeam ? (
          <Image
            alt={`${pick.pickTeam.TeamCity} ${pick.pickTeam.TeamName}`}
            className="size-15"
            height={60}
            src={`/NFLLogos/${pick.pickTeam.TeamLogo}`}
            title={`${pick.pickTeam.TeamCity} ${pick.pickTeam.TeamName}`}
            width={60}
          />
        ) : (
          <h4 className="mb-0">
            No
            <br />
            Pick
          </h4>
        )}
        {pick.PickPoints}
        {poolPercentage !== null && (
          <div
            className="text-xs font-light text-muted-foreground"
            title={
              pick.pickTeam
                ? `${poolPercentage}% of the pool also picked the ${pick.pickTeam.TeamName}`
                : `${poolPercentage}% of the pool`
            }
          >
            {poolPercentage}%
          </div>
        )}
      </TableCell>
    );
  };

  // fallow-ignore-next-line complexity -- one user's row across all games; CRAP reflects missing component-test coverage
  const renderRow = (user: Awaited<ReturnType<typeof getWeeklyRankings>>[number]) => {
    const userPicks = picks.filter((pick) => pick.UserID === user.UserID);

    return (
      <TableRow
        className={cn(user.UserID === currentUserId && "bg-yellow-200 [&_*]:text-black")}
        key={`picks-for-user-${user.UserID}`}
      >
        <TableHead
          className={cn(
            "text-foreground font-semibold sticky left-0 z-[1] text-nowrap",
            user.UserID === currentUserId ? "bg-yellow-200 [&_*]:text-black" : "bg-card",
          )}
          scope="row"
        >
          {user.Tied === 1 && "T"}
          {user.Rank}. {user.UserName}
          <div className="hidden md:block">
            <span className="invisible">
              {user.Tied === 1 && "T"}
              {user.Rank}.
            </span>{" "}
            {user.TeamName}
          </div>
          <div className="flex md:hidden font-light justify-between">
            <div title="Points Earned">
              PE
              <br />
              {user.PointsEarned}
            </div>
            <div title="Games Correct">
              GC
              <br />
              {user.GamesCorrect}
            </div>
            <div title="My Tiebreaker">
              MT
              <br />
              {user.TiebreakerScore}
            </div>
            <div title="Actual Score">
              AS
              <br />
              {user.LastScore}
            </div>
          </div>
        </TableHead>
        {userPicks.map(renderPickCell)}
        <TableCell className="hidden md:table-cell text-center">{user.PointsEarned}</TableCell>
        <TableCell className="hidden md:table-cell text-center">{user.GamesCorrect}</TableCell>
        <TableCell className="hidden md:table-cell text-center">{user.TiebreakerScore}</TableCell>
        <TableCell className="hidden md:table-cell text-center">{user.LastScore}</TableCell>
      </TableRow>
    );
  };

  return (
    <Table className="align-middle" parentClassName="rounded max-w-[98vw] max-h-[98vh] overflow-scroll">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className={cn("sticky top-0 left-0 z-[2] opacity-0")} />
          {Array.from({ length: Object.keys(games).length }).map((_, i) => (
            <TableHead
              className="sticky top-0 z-[1] opacity-0 min-w-15"
              key={`placeholder-for-game-${
                // biome-ignore lint/suspicious/noArrayIndexKey: This is a placeholder for a game header
                i
              }`}
            />
          ))}
          <TableHead
            className="text-foreground font-semibold bg-card text-center hidden md:table-cell sticky top-0 z-[1]"
            scope="col"
          >
            Points Earned
          </TableHead>
          <TableHead
            className="text-foreground font-semibold bg-card text-center hidden md:table-cell sticky top-0 z-[1]"
            scope="col"
          >
            Games Correct
          </TableHead>
          <TableHead
            className="text-foreground font-semibold bg-card text-center hidden md:table-cell sticky top-0 z-[1]"
            scope="col"
          >
            Tiebreaker
          </TableHead>
          <TableHead
            className="text-foreground font-semibold bg-card text-center hidden md:table-cell sticky top-0 z-[1]"
            scope="col"
          >
            Actual Score
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="bg-muted/80">{ranks.map(renderRow)}</TableBody>
    </Table>
  );
};

export default ViewAllTable;
