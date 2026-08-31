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

import { Skeleton } from "@nfl-pool-monorepo/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nfl-pool-monorepo/ui/components/table";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { type FC, Suspense } from "react";
import { PiAtDuotone } from "react-icons/pi";
import "server-only";

import CustomHead from "@/components/CustomHead/CustomHead";
import MyPicksHead from "@/components/MyPicksHead/MyPicksHead";
import PageContent from "@/components/PageContent/PageContent";
import PageTransition from "@/components/ViewTransitions/PageTransition";
import { requireRegistered } from "@/lib/auth";
import { getMyWeeklyPicks } from "@/server/loaders/pick";
import { getSelectedWeekFromParams } from "@/server/loaders/week";

import ViewPicksLoading from "./loading";

const TITLE = "My Weekly Picks";

export const metadata: Metadata = {
  title: TITLE,
};

const ViewPicksPageBody: FC<PageProps<"/picks/view">> = async ({ searchParams }) => {
  const redirectUrl = await requireRegistered();

  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  const selectedWeek = await getSelectedWeekFromParams(searchParams);
  const myWeeklyPicksPromise = getMyWeeklyPicks(selectedWeek);

  const [myWeeklyPicks] = await Promise.all([myWeeklyPicksPromise]);

  return (
    <PageTransition>
      <div className="h-full flex flex-col md:mx-3">
        <CustomHead title={`My Week ${selectedWeek} Picks`} />
        <PageContent className="pb-4">
          <div className="flex flex-col min-h-screen">
            <Suspense fallback={<Skeleton className="h-32 w-full" />}>
              <MyPicksHead week={selectedWeek} />
            </Suspense>
            <div className="w-full">
              <div className="rounded table-responsive">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-full text-foreground font-bold" scope="col">
                        Game
                      </TableHead>
                      <TableHead className="min-w-14 w-14 text-center text-foreground font-bold" scope="col">
                        Pick
                      </TableHead>
                      <TableHead className="text-center text-foreground font-bold" scope="col">
                        Points
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myWeeklyPicks.map((row) => (
                      <TableRow
                        className={cn(
                          row.WinnerTeamID && row.WinnerTeamID === row.TeamID && "bg-green-200",
                          row.WinnerTeamID && row.WinnerTeamID !== row.TeamID && "bg-red-300",
                        )}
                        key={`pick-for-game-${row.GameID}`}
                      >
                        <TableHead className="text-foreground font-bold p-2" scope="row">
                          <div className="flex justify-start items-center">
                            <Image
                              alt={`${row.visitorTeam?.TeamCity} ${row.visitorTeam?.TeamName}`}
                              height={40}
                              src={`/NFLLogos/${row.visitorTeam?.TeamLogo}`}
                              title={`${row.visitorTeam?.TeamCity} ${row.visitorTeam?.TeamName}`}
                              width={40}
                            />
                            <div className="ps-1 hidden md:block">
                              {row.visitorTeam?.TeamCity} {row.visitorTeam?.TeamName}
                            </div>
                            <PiAtDuotone className="mx-2" />
                            <Image
                              alt={`${row.homeTeam?.TeamCity} ${row.homeTeam?.TeamName}`}
                              height={40}
                              src={`/NFLLogos/${row.homeTeam?.TeamLogo}`}
                              title={`${row.homeTeam?.TeamCity} ${row.homeTeam?.TeamName}`}
                              width={40}
                            />
                            <div className="ps-1 hidden md:block">
                              {row.homeTeam?.TeamCity} {row.homeTeam?.TeamName}
                            </div>
                          </div>
                        </TableHead>
                        <TableCell className="text-center">
                          {!!row.pickTeam && (
                            <Image
                              alt={`${row.pickTeam.TeamCity} ${row.pickTeam.TeamName}`}
                              height={40}
                              src={`/NFLLogos/${row.pickTeam.TeamLogo}`}
                              title={`${row.pickTeam.TeamCity} ${row.pickTeam.TeamName}`}
                              width={40}
                            />
                          )}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-center",
                            row.WinnerTeamID && row.WinnerTeamID === row.TeamID && "text-emerald-900",
                            row.WinnerTeamID && row.WinnerTeamID !== row.TeamID && "text-red-900 line-through",
                          )}
                        >
                          {row.PickPoints}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </PageContent>
      </div>
    </PageTransition>
  );
};

const ViewPicks: FC<PageProps<"/picks/view">> = (props) => (
  <Suspense fallback={<ViewPicksLoading />}>
    <ViewPicksPageBody {...props} />
  </Suspense>
);

export default ViewPicks;
