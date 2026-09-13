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

import { Table, TableBody, TableHead, TableHeader, TableRow } from "@nfl-pool-monorepo/ui/components/table";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { type FC, Suspense } from "react";
import "server-only";

import AdminGameRow from "@/components/AdminGameRow/AdminGameRow";
import CustomHead from "@/components/CustomHead/CustomHead";
import PageContent from "@/components/PageContent/PageContent";
import PageTransition from "@/components/ViewTransitions/PageTransition";
import { requireAdmin } from "@/lib/auth";
import { getGamesForWeekScoreboardCached } from "@/server/loaders/game";
import { getSelectedWeekFromParams } from "@/server/loaders/week";

import AdminLoading from "../loading";

const TITLE = "Manage Games";

export const metadata: Metadata = {
  title: TITLE,
};

const formatKickoff = (kickoff: Date): string =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Chicago",
  }).format(kickoff);

const AdminGamesPageBody: FC<PageProps<"/weekly">> = async ({ searchParams }) => {
  const redirectUrl = await requireAdmin();

  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  const selectedWeek = await getSelectedWeekFromParams(searchParams);
  const games = await getGamesForWeekScoreboardCached(selectedWeek);

  return (
    <PageTransition>
      <div className="h-full flex flex-col md:mx-3">
        <CustomHead title={TITLE} />
        <PageContent className="pt-0 md:pt-3 pb-4">
          <h1 className="text-4xl font-semibold tracking-tight mb-2">{TITLE}</h1>
          <p className="text-muted-foreground mb-6">
            Week {selectedWeek} &mdash; manually correct scores and status when the API is wrong or stuck. Standings
            refresh immediately.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Game</TableHead>
                <TableHead className="text-end">Scores, status, and save</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {games.map((game) => (
                <AdminGameRow
                  away={game.visitorTeam?.TeamName ?? "Unknown"}
                  gameID={game.GameID}
                  home={game.homeTeam?.TeamName ?? "Unknown"}
                  homeScore={game.GameHomeScore ?? 0}
                  key={game.GameID}
                  kickoffLabel={formatKickoff(game.GameKickoff)}
                  status={game.GameStatus}
                  visitorScore={game.GameVisitorScore ?? 0}
                />
              ))}
            </TableBody>
          </Table>
        </PageContent>
      </div>
    </PageTransition>
  );
};

const AdminGamesPage: FC<PageProps<"/weekly">> = (props) => (
  <Suspense fallback={<AdminLoading />}>
    <AdminGamesPageBody {...props} />
  </Suspense>
);

export default AdminGamesPage;
