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

import { Button } from "@nfl-pool-monorepo/ui/components/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@nfl-pool-monorepo/ui/components/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nfl-pool-monorepo/ui/components/table";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { type FC, Suspense } from "react";
import "server-only";

import CustomHead from "@/components/CustomHead/CustomHead";
import PageContent from "@/components/PageContent/PageContent";
import PageTransition from "@/components/ViewTransitions/PageTransition";
import { requireRegistered } from "@/lib/auth";
import { getHeadToHead } from "@/server/loaders/headToHead";
import { requireUser } from "@/server/loaders/sessions";
import { getSelectedWeekFromParams } from "@/server/loaders/week";
import { getWeeklyRankings } from "@/server/loaders/weeklyMv";

import HeadToHeadLoading from "./loading";

const TITLE = "Head-to-Head";

export const metadata: Metadata = {
  title: TITLE,
};

// Reuse an established route's PageProps shape: TS 7 native briefly rejects
// freshly-added route literals in PageProps until the typegen cache warms up.
type HeadToHeadPageBodyProps = PageProps<"/weekly">;

const parseUserIDParam = (value: string | string[] | undefined): null | number => {
  const raw = Array.isArray(value) ? value[0] : value;

  if (!raw) {
    return null;
  }

  const parsed = Number(raw);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const HeadToHeadPageBody: FC<HeadToHeadPageBodyProps> = async ({ searchParams }) => {
  const redirectUrl = await requireRegistered();

  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  const params = await searchParams;
  const selectedWeek = await getSelectedWeekFromParams(searchParams);
  const user = await requireUser();
  const users = await getWeeklyRankings(selectedWeek);

  const userAID = parseUserIDParam(params.a) ?? user.id;
  const userBID = parseUserIDParam(params.b) ?? users.find((ranking) => ranking.UserID !== userAID)?.UserID;

  if (!userAID || !userBID) {
    return redirect("/");
  }

  const userA = users.find((ranking) => ranking.UserID === userAID);
  const userB = users.find((ranking) => ranking.UserID === userBID);
  const { games, picksA, picksB, rankA, rankB } = await getHeadToHead(selectedWeek, userAID, userBID);

  let pointsA = 0;
  let pointsB = 0;

  for (const game of games) {
    const pickA = picksA.get(game.GameID);
    const pickB = picksB.get(game.GameID);

    if (game.WinnerTeamID !== null) {
      if (pickA?.TeamID === game.WinnerTeamID) {
        pointsA += pickA.PickPoints ?? 0;
      }

      if (pickB?.TeamID === game.WinnerTeamID) {
        pointsB += pickB.PickPoints ?? 0;
      }
    }
  }

  return (
    <PageTransition>
      <div className="h-full flex flex-col md:mx-3">
        <CustomHead title={TITLE} />
        <PageContent className="px-3 pt-5 pb-4 md:px-5 md:pt-3">
          <h1 className="text-4xl font-semibold tracking-tight mb-6">{TITLE}</h1>
          <form className="flex flex-wrap items-end gap-3 mb-6" method="get">
            <input name="week" type="hidden" value={selectedWeek} />
            <div className="flex flex-col gap-1 text-sm">
              Player 1
              <Select defaultValue={String(userAID)} name="a">
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Choose a player" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((ranking) => (
                    <SelectItem key={ranking.UserID} value={String(ranking.UserID)}>
                      {ranking.TeamName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              Player 2
              <Select defaultValue={String(userBID)} name="b">
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Choose a player" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((ranking) => (
                    <SelectItem key={ranking.UserID} value={String(ranking.UserID)}>
                      {ranking.TeamName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" variant="primary">
              Compare
            </Button>
          </form>
          <div className="grid grid-cols-2 gap-4 mb-6 max-w-xl">
            <div className="border border-border rounded-lg p-4 text-center">
              <div className="text-lg font-semibold">{userA?.TeamName}</div>
              <div className="text-sm text-muted-foreground">Rank {rankA?.Rank ?? "-"}</div>
              <div className="text-3xl font-bold">{pointsA}</div>
            </div>
            <div className="border border-border rounded-lg p-4 text-center">
              <div className="text-lg font-semibold">{userB?.TeamName}</div>
              <div className="text-sm text-muted-foreground">Rank {rankB?.Rank ?? "-"}</div>
              <div className="text-3xl font-bold">{pointsB}</div>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Game</TableHead>
                <TableHead className="text-center">{userA?.TeamName}</TableHead>
                <TableHead className="text-center">{userB?.TeamName}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {games.map((game) => {
                const pickA = picksA.get(game.GameID);
                const pickB = picksB.get(game.GameID);
                const isFinal = game.GameStatus === "Final";

                const renderPick = (pick: { PickPoints: null | number; TeamID: null | number } | undefined) => {
                  if (!pick?.TeamID) {
                    return <span className="text-muted-foreground">-</span>;
                  }

                  const team = pick.TeamID === game.homeTeam?.TeamID ? game.homeTeam : game.visitorTeam;
                  const isWinner = isFinal && game.WinnerTeamID === pick.TeamID;

                  return (
                    <span className={cn(isWinner && "font-semibold text-green-700")}>
                      {team?.TeamName} ({pick.PickPoints ?? "-"})
                    </span>
                  );
                };

                return (
                  <TableRow key={game.GameID}>
                    <TableCell className="text-center">
                      {game.visitorTeam?.TeamName} @ {game.homeTeam?.TeamName}
                      {isFinal && (
                        <div className="text-sm text-muted-foreground">
                          Final: {game.GameVisitorScore} - {game.GameHomeScore}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{renderPick(pickA)}</TableCell>
                    <TableCell className="text-center">{renderPick(pickB)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </PageContent>
      </div>
    </PageTransition>
  );
};

const HeadToHeadPage: FC<HeadToHeadPageBodyProps> = (props) => (
  <Suspense fallback={<HeadToHeadLoading />}>
    <HeadToHeadPageBody {...props} />
  </Suspense>
);

export default HeadToHeadPage;
