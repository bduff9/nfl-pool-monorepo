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

import { Alert, AlertDescription, AlertTitle } from "@nfl-pool-monorepo/ui/components/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nfl-pool-monorepo/ui/components/table";
import { WEEKS_IN_SEASON } from "@nfl-pool-monorepo/utils/constants";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import "server-only";

import { type FC, Suspense } from "react";
import { PiInfoDuotone } from "react-icons/pi";

import CustomHead from "@/components/CustomHead/CustomHead";
import PageContent from "@/components/PageContent/PageContent";
import { ProgressBarLink } from "@/components/ProgressBar/ProgressBar";
import ProgressChart from "@/components/ProgressChart/ProgressChart";
import SurvivorDashboardIcon from "@/components/SurvivorDashboardIcon/SurvivorDashboardIcon";
import PageTransition from "@/components/ViewTransitions/PageTransition";
import { requireRegistered } from "@/lib/auth";
import { getWeekInProgress } from "@/server/loaders/game";
import { getIsAliveInSurvivor, getMySurvivorPickForWeek } from "@/server/loaders/survivor";
import {
  getMySurvivorMv,
  getSurvivorOverallCounts,
  getSurvivorRankings,
  getSurvivorStatus,
  getSurvivorWeeklyCounts,
} from "@/server/loaders/survivorMv";
import { getCurrentUser } from "@/server/loaders/user";
import { getSelectedWeekFromParams, getWeekStatus } from "@/server/loaders/week";

import SurvivorViewLoading from "./loading";

export const metadata: Metadata = {
  title: { absolute: "View Survivor Picks" },
};

// fallow-ignore-next-line complexity -- two-level loop over rankings x picks is inherent to computing per-week consensus percentages
const getSurvivorPoolPercentage = (
  survivorRankings: Awaited<ReturnType<typeof getSurvivorRankings>>,
  week: number,
  teamID: null | number,
): number | null => {
  if (!teamID) {
    return null;
  }

  let teamCount = 0;
  let totalCount = 0;

  for (const row of survivorRankings) {
    for (const pick of row.allPicks) {
      if (pick.SurvivorPickWeek !== week || !pick.TeamID) {
        continue;
      }

      totalCount++;

      if (pick.TeamID === teamID) {
        teamCount++;
      }
    }
  }

  if (!totalCount) {
    return null;
  }

  return Math.round((teamCount / totalCount) * 100);
};

const getPickCellColor = (
  pick: Awaited<ReturnType<typeof getSurvivorRankings>>[number]["allPicks"][number],
): string => {
  if (pick.TeamID === null) {
    return "bg-red-700";
  }

  if (pick.WinnerTeamID === null) {
    return "";
  }

  return pick.WinnerTeamID === pick.TeamID ? "bg-green-700" : "bg-red-700";
};

// fallow-ignore-next-line complexity -- long-standing page body; added only the eliminated-notice alert
const ViewSurvivorPageBody: FC<PageProps<"/survivor/view">> = async ({ searchParams }) => {
  const redirectUrl = await requireRegistered();

  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  const selectedWeek = await getSelectedWeekFromParams(searchParams);
  const { eliminated: eliminatedParam } = await searchParams;
  const showEliminatedNotice = eliminatedParam === "1";
  const weekStatusPromise = getWeekStatus(selectedWeek);
  const isAliveInSurvivorPromise = getIsAliveInSurvivor();
  const userPromise = getCurrentUser();
  const mySurvivorMvPromise = getMySurvivorMv();
  const mySurvivorPickForWeekPromise = getMySurvivorPickForWeek(selectedWeek);
  const survivorStatusPromise = getSurvivorStatus();
  const survivorOverallCountsPromise = getSurvivorOverallCounts();
  const survivorWeeklyCountsPromise = getSurvivorWeeklyCounts(selectedWeek);
  const weekInProgressPromise = getWeekInProgress();
  const survivorRankingsPromise = getSurvivorRankings();

  const [
    weekStatus,
    isAliveInSurvivor,
    user,
    mySurvivorMv,
    mySurvivorPickForWeek,
    survivorStatus,
    survivorOverallCounts,
    survivorWeeklyCounts,
    weekInProgress,
    survivorRankings,
  ] = await Promise.all([
    weekStatusPromise,
    isAliveInSurvivorPromise,
    userPromise,
    mySurvivorMvPromise,
    mySurvivorPickForWeekPromise,
    survivorStatusPromise,
    survivorOverallCountsPromise,
    survivorWeeklyCountsPromise,
    weekInProgressPromise,
    survivorRankingsPromise,
  ]);

  if (survivorStatus === "Not Started") {
    return redirect("/");
  }

  return (
    <PageTransition>
      <div className="h-full flex flex-col md:mx-3">
        <CustomHead title="View Survivor Picks" />
        <PageContent className="pt-5 md:pt-3 pb-4">
          <div className="flex flex-col min-h-screen">
            {showEliminatedNotice && !isAliveInSurvivor && user.UserPlaysSurvivor === 1 && (
              <Alert className="mb-4 shrink-0">
                <PiInfoDuotone />
                <AlertTitle>You&apos;ve been eliminated from the survivor pool</AlertTitle>
                <AlertDescription>
                  Your picks are shown below. The overall confidence pool is still wide open, though — keep those weekly
                  picks coming!
                </AlertDescription>
              </Alert>
            )}
            <div className="flex">
              <div className={cn("hidden md:inline-block w-1/3 text-center h-[205px]")}>
                <SurvivorDashboardIcon
                  isAlive={isAliveInSurvivor}
                  isPlaying={user.UserPlaysSurvivor === 1}
                  lastPick={mySurvivorMv?.lastPickTeam}
                  pickForWeek={mySurvivorPickForWeek}
                />
              </div>
              <div className="mt-4 block md:hidden">
                <ProgressBarLink href="/">&laquo; Back to Dashboard</ProgressBarLink>
              </div>
              <div className={cn("hidden md:inline-block w-2/3 pt-8 px-3")}>
                <ProgressChart
                  correct={survivorWeeklyCounts.aliveCount}
                  incorrect={survivorWeeklyCounts.deadCount}
                  inProgress={survivorWeeklyCounts.waitingCount}
                  isOver={weekStatus === "Complete"}
                  layoutId="survivorWeekStatus"
                  max={survivorWeeklyCounts.overallCount}
                  type="Current Week Remaining"
                />
                <ProgressChart
                  correct={survivorOverallCounts.aliveCount}
                  incorrect={survivorOverallCounts.deadCount}
                  isOver={survivorStatus === "Complete"}
                  layoutId="survivorOverallStatus"
                  max={survivorOverallCounts.overallCount}
                  type="Overall Remaining"
                />
              </div>
            </div>
            <div className={cn("w-full mt-4 text-center p-0")}>
              <Table parentClassName="max-w-[98vw] max-h-[98vh] overflow-scroll">
                <TableHeader>
                  <TableRow className={cn("hidden md:table-row")}>
                    <TableHead className="text-center bg-card text-foreground font-semibold" colSpan={99}>
                      Week
                    </TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead
                      className="bg-card text-foreground text-center font-semibold sticky top-0 left-0 z-[2]"
                      scope="col"
                    >
                      Player
                    </TableHead>
                    {Array.from({ length: weekInProgress ?? WEEKS_IN_SEASON }, (_, i) => i + 1).map((week) => (
                      <TableHead
                        className="text-foreground text-center font-semibold sticky z-[1] top-0 bg-card"
                        key={`header-for-week-${week}`}
                        scope="col"
                      >
                        <span className="hidden md:inline">{week}</span>
                        <span className="md:hidden">W{week}</span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {survivorRankings.map((row) => (
                    <TableRow className="h-[94px]" key={`picks-for-user-${row.UserID}`}>
                      <TableHead
                        className={cn(
                          row.IsAliveOverall ? "bg-green-700" : "bg-red-700",
                          "sticky left-0 z-[1] text-foreground font-semibold text-center",
                        )}
                        scope="row"
                      >
                        {row.UserName}
                        <span className="hidden md:inline">
                          <br />
                          {row.TeamName}
                        </span>
                      </TableHead>
                      {row.allPicks.map((pick) => {
                        const poolPercentage = getSurvivorPoolPercentage(
                          survivorRankings,
                          pick.SurvivorPickWeek,
                          pick.TeamID,
                        );

                        return (
                          <TableCell
                            className={cn(getPickCellColor(pick))}
                            key={`pick-for-user-${row.UserID}-week-${pick.SurvivorPickWeek}`}
                          >
                            {pick.TeamID ? (
                              <>
                                <Image
                                  alt={`${pick.TeamCity} ${pick.TeamName}`}
                                  className="m-auto"
                                  height={70}
                                  src={`/NFLLogos/${pick.TeamLogo}`}
                                  title={`${pick.TeamCity} ${pick.TeamName}`}
                                  width={70}
                                />
                                {poolPercentage !== null && (
                                  <div
                                    className="text-xs font-light text-foreground"
                                    title={`${poolPercentage}% of the pool picked the ${pick.TeamCity} ${pick.TeamName} this week`}
                                  >
                                    {poolPercentage}%
                                  </div>
                                )}
                              </>
                            ) : (
                              <h4 className="mb-0 scroll-m-20 text-xl font-semibold tracking-tight">
                                No
                                <br />
                                Pick
                              </h4>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </PageContent>
      </div>
    </PageTransition>
  );
};

const ViewSurvivor: FC<PageProps<"/survivor/view">> = (props) => (
  <Suspense fallback={<SurvivorViewLoading />}>
    <ViewSurvivorPageBody {...props} />
  </Suspense>
);

export default ViewSurvivor;
