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
import { PiFootballDuotone } from "react-icons/pi";
import "server-only";

import CustomHead from "@/components/CustomHead/CustomHead";
import PageContent from "@/components/PageContent/PageContent";
import PageTransition from "@/components/ViewTransitions/PageTransition";
import WeekTransition from "@/components/ViewTransitions/WeekTransition";
import { WeekLink } from "@/components/WeekLink/WeekLink";
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

// fallow-ignore-next-line complexity -- pre-existing param coercion; CRAP reflects missing unit-test coverage
const parseUserIDParam = (value: string | string[] | undefined): null | number => {
  const raw = Array.isArray(value) ? value[0] : value;

  if (!raw) {
    return null;
  }

  const parsed = Number(raw);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

type HeadToHead = Awaited<ReturnType<typeof getHeadToHead>>;
type Ranking = Awaited<ReturnType<typeof getWeeklyRankings>>[number];
type Game = HeadToHead["games"][number];
type Pick = { PickPoints: null | number; TeamID: null | number };

const NotReadyState: FC<{ selectedWeek: number }> = ({ selectedWeek }) => (
  <div className="h-full flex flex-col md:mx-3">
    <CustomHead title={TITLE} />
    <PageContent className="pt-5 md:pt-3 pb-4">
      <div className="flex flex-col items-center justify-center gap-3 min-h-[50vh] text-center">
        <PiFootballDuotone aria-hidden="true" className="size-16 text-muted-foreground" />
        <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight">
          Standings for week {selectedWeek} aren&apos;t ready yet
        </h2>
        <p className="max-w-md text-muted-foreground">
          Head-to-head matchups appear once this week&apos;s results start coming in. Check back soon!
        </p>
        <WeekLink className="inline-block py-2.5" href="/">
          &laquo; Back to Dashboard
        </WeekLink>
      </div>
    </PageContent>
  </div>
);

const isWinningPick = (game: Game, pick: Pick | undefined): boolean =>
  game.WinnerTeamID !== null && pick?.TeamID === game.WinnerTeamID;

const getEarnedPoints = (game: Game, pick: Pick | undefined): number =>
  isWinningPick(game, pick) ? (pick?.PickPoints ?? 0) : 0;

// Points a player earned: the confidence points on every pick that matched its game's winner
const getPoints = (games: HeadToHead["games"], picks: HeadToHead["picksA"]): number =>
  games.reduce((total, game) => total + getEarnedPoints(game, picks.get(game.GameID)), 0);

type PlayerSelectProps = {
  label: string;
  name: "a" | "b";
  selectedID: number;
  users: Array<Ranking>;
};

const PlayerSelect: FC<PlayerSelectProps> = ({ label, name, selectedID, users }) => (
  <div className="flex flex-col gap-1 text-sm">
    {label}
    <Select defaultValue={String(selectedID)} name={name}>
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
);

type ScoreCardProps = {
  points: number;
  rank: null | number | string | undefined;
  teamName: string | undefined;
};

const ScoreCard: FC<ScoreCardProps> = ({ points, rank, teamName }) => (
  <div className="border border-border rounded-lg p-4 text-center">
    <div className="text-lg font-semibold">{teamName}</div>
    <div className="text-sm text-muted-foreground">Rank {rank ?? "-"}</div>
    <div className="text-3xl font-bold">{points}</div>
  </div>
);

// fallow-ignore-next-line complexity -- pre-existing pick cell rendering; CRAP reflects missing component-test coverage, not branching
const PickCell: FC<{ game: Game; pick: Pick | undefined }> = ({ game, pick }) => {
  if (!pick?.TeamID) {
    return <span className="text-muted-foreground">-</span>;
  }

  const team = pick.TeamID === game.homeTeam?.TeamID ? game.homeTeam : game.visitorTeam;
  const isWinner = game.GameStatus === "Final" && game.WinnerTeamID === pick.TeamID;

  return (
    <span className={cn(isWinner && "font-semibold text-green-700")}>
      {team?.TeamName} ({pick.PickPoints ?? "-"})
    </span>
  );
};

const GameRow: FC<{ game: Game; pickA: Pick | undefined; pickB: Pick | undefined }> = ({ game, pickA, pickB }) => (
  <TableRow>
    <TableCell className="text-center">
      {game.visitorTeam?.TeamName} @ {game.homeTeam?.TeamName}
      {game.GameStatus === "Final" && (
        <div className="text-sm text-muted-foreground">
          Final: {game.GameVisitorScore} - {game.GameHomeScore}
        </div>
      )}
    </TableCell>
    <TableCell className="text-center">
      <PickCell game={game} pick={pickA} />
    </TableCell>
    <TableCell className="text-center">
      <PickCell game={game} pick={pickB} />
    </TableCell>
  </TableRow>
);

// fallow-ignore-next-line complexity -- long-standing page body: redirect, param resolution and the empty-state early return follow the existing page pattern
const HeadToHeadPageBody: FC<HeadToHeadPageBodyProps> = async ({ searchParams }) => {
  const redirectUrl = await requireRegistered();

  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  const [params, selectedWeek, user] = await Promise.all([
    searchParams,
    getSelectedWeekFromParams(searchParams),
    requireUser(),
  ]);
  const users = await getWeeklyRankings(selectedWeek);

  const userAID = parseUserIDParam(params.a) ?? user.id;
  const userBID = parseUserIDParam(params.b) ?? users.find((ranking) => ranking.UserID !== userAID)?.UserID;

  if (!userAID || !userBID) {
    return (
      <WeekTransition key={selectedWeek}>
        <NotReadyState selectedWeek={selectedWeek} />
      </WeekTransition>
    );
  }

  const userA = users.find((ranking) => ranking.UserID === userAID);
  const userB = users.find((ranking) => ranking.UserID === userBID);
  const { games, picksA, picksB, rankA, rankB } = await getHeadToHead(selectedWeek, userAID, userBID);

  return (
    <WeekTransition key={selectedWeek}>
      <div className="h-full flex flex-col md:mx-3">
        <CustomHead title={TITLE} />
        <PageContent className="px-3 pt-5 pb-4 md:px-5 md:pt-3">
          <h1 className="text-4xl font-semibold tracking-tight mb-6">{TITLE}</h1>
          <form className="flex flex-wrap items-end gap-3 mb-6" method="get">
            <input name="week" type="hidden" value={selectedWeek} />
            <PlayerSelect label="Player 1" name="a" selectedID={userAID} users={users} />
            <PlayerSelect label="Player 2" name="b" selectedID={userBID} users={users} />
            <Button type="submit" variant="primary">
              Compare
            </Button>
          </form>
          <div className="grid grid-cols-2 gap-4 mb-6 max-w-xl">
            <ScoreCard points={getPoints(games, picksA)} rank={rankA?.Rank} teamName={userA?.TeamName} />
            <ScoreCard points={getPoints(games, picksB)} rank={rankB?.Rank} teamName={userB?.TeamName} />
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
              {games.map((game) => (
                <GameRow
                  game={game}
                  key={game.GameID}
                  pickA={picksA.get(game.GameID)}
                  pickB={picksB.get(game.GameID)}
                />
              ))}
            </TableBody>
          </Table>
        </PageContent>
      </div>
    </WeekTransition>
  );
};

const HeadToHeadPage: FC<HeadToHeadPageBodyProps> = (props) => (
  <PageTransition>
    <Suspense fallback={<HeadToHeadLoading />}>
      <HeadToHeadPageBody {...props} />
    </Suspense>
  </PageTransition>
);

export default HeadToHeadPage;
