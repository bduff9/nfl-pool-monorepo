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

import { TableCell } from "@nfl-pool-monorepo/ui/components/table";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import "server-only";

import { type FC, Suspense } from "react";

import RankingsTable from "@/app/RankingsTable";
import CustomHead from "@/components/CustomHead/CustomHead";
import PageContent from "@/components/PageContent/PageContent";
import ProgressChart from "@/components/ProgressChart/ProgressChart";
import RankingPieChart from "@/components/RankingPieChart/RankingPieChart";
import RetryableSection from "@/components/RetryableSection/RetryableSection";
import ScenariosDashboard from "@/components/ScenariosDashboard/ScenariosDashboard";
import ScoreboardLiveRefresh from "@/components/ScoreboardLiveRefresh/ScoreboardLiveRefresh";
import SectionError from "@/components/SectionError/SectionError.client";
import ShareButton from "@/components/ShareButton/ShareButton.client";
import Crossfade from "@/components/ViewTransitions/Crossfade";
import PageTransition from "@/components/ViewTransitions/PageTransition";
import WeekTransition from "@/components/ViewTransitions/WeekTransition";
import { WeekLink } from "@/components/WeekLink/WeekLink";
import { WeeklyDashboardResults, WeeklyDashboardTitle } from "@/components/WeeklyDashboard/WeeklyDashboard.client";
import { requireRegistered } from "@/lib/auth";
import { buildWeekResultShareText } from "@/lib/share/shareText";
import { withWeek } from "@/lib/weekSearchParams";
import { getGamesForWeekScoreboardCached } from "@/server/loaders/game";
import { getCurrentUser } from "@/server/loaders/user";
import { getSelectedWeekFromParams, getWeekStatus } from "@/server/loaders/week";
import { getMyWeeklyRank, getWeeklyMvCount, getWeeklyMvTiedCount, getWeeklyRankings } from "@/server/loaders/weeklyMv";

import WeeklyLoading from "./loading";

const TITLE = "Weekly Ranks";

export const metadata: Metadata = {
  title: TITLE,
};

const renderTiebreakerCells = (row: {
  IsEliminated: number;
  LastScore: number | null;
  TiebreakerScore: number | null;
}) => (
  <>
    <TableCell>{row.TiebreakerScore}</TableCell>
    <TableCell>{row.LastScore}</TableCell>
    <TableCell className="text-red-700">{row.IsEliminated === 1 && <b>X</b>}</TableCell>
  </>
);

type WeeklyRankingsTableProps = {
  selectedWeek: number;
};

const WeeklyRankingsTable: FC<WeeklyRankingsTableProps> = async ({ selectedWeek }) => {
  const [weeklyRankings, user] = await Promise.all([getWeeklyRankings(selectedWeek), getCurrentUser()]);

  return (
    <RankingsTable
      currentUserId={user.UserID}
      extraHeadings={["Tiebreaker", "Last Game", "Eliminated"]}
      renderExtraCells={renderTiebreakerCells}
      rows={weeklyRankings}
    />
  );
};

// fallow-ignore-next-line complexity -- long-standing page body; this change only adds the Still In Play panel and rebalances chart columns
const WeeklyRankingsPageBody: FC<PageProps<"/weekly">> = async ({ searchParams }) => {
  const redirectUrl = await requireRegistered();

  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  const selectedWeek = await getSelectedWeekFromParams(searchParams);

  const weekStatusPromise = getWeekStatus(selectedWeek);
  const weeklyTotalCountPromise = getWeeklyMvCount(selectedWeek);
  const weeklyTiedCountPromise = getWeeklyMvTiedCount(selectedWeek);
  const myWeeklyRankPromise = getMyWeeklyRank(selectedWeek);
  const [weekStatus, weeklyTotalCount, weeklyTiedCount, myWeeklyRank] = await Promise.all([
    weekStatusPromise,
    weeklyTotalCountPromise,
    weeklyTiedCountPromise,
    myWeeklyRankPromise,
  ]);

  if (weeklyTotalCount === 0) {
    return redirect(withWeek("/", selectedWeek));
  }

  const myPlace = `${myWeeklyRank?.Tied ? "T" : ""}${myWeeklyRank?.Rank}`;
  const me = myWeeklyRank?.Rank ?? 0;
  const aheadOfMe = me - 1;
  const behindMe = weeklyTotalCount - me - weeklyTiedCount;

  const weekGames = await getGamesForWeekScoreboardCached(selectedWeek);
  const hasLiveGames =
    weekStatus === "In Progress" &&
    weekGames.some((game) => game.GameStatus !== "Pregame" && game.GameStatus !== "Final");

  return (
    <WeekTransition key={selectedWeek}>
      <div className="h-full flex flex-col md:mx-3">
        <CustomHead title={`Week ${selectedWeek} Ranks`} />
        <ScoreboardLiveRefresh enabled={hasLiveGames} />
        <PageContent className="pt-0 md:pt-3 pb-4">
          <div className="flex flex-wrap items-start">
            <div className="hidden md:inline-block w-[25%] text-center h-[205px]">
              <WeeklyDashboardTitle selectedWeek={selectedWeek} />
              <RankingPieChart
                data={[
                  {
                    fill: "var(--color-red-700)",
                    myPlace,
                    name: "ahead of me",
                    total: weeklyTotalCount,
                    value: aheadOfMe,
                  },
                  {
                    fill: "var(--color-green-700)",
                    myPlace,
                    name: "behind me",
                    total: weeklyTotalCount,
                    value: behindMe,
                  },
                  {
                    fill: "var(--color-amber-600)",
                    myPlace,
                    name: "tied with me",
                    total: weeklyTotalCount,
                    value: weeklyTiedCount,
                  },
                ]}
                transitionName="weeklyRankingPieChart"
              />
            </div>
            <div className="-order-2 md:order-none mt-4 block md:hidden">
              <WeekLink className="inline-block py-2.5" href="/">
                &laquo; Back to Dashboard
              </WeekLink>
            </div>
            <SectionError title="Scenarios">
              <Suspense fallback={null}>
                <ScenariosDashboard scope="weekly" />
              </Suspense>
            </SectionError>
            <div className="hidden md:inline-block flex-1 px-3">
              <WeeklyDashboardResults className="mb-4 text-center" selectedWeek={selectedWeek} />
              <ProgressChart
                correct={myWeeklyRank?.PointsEarned ?? 0}
                incorrect={myWeeklyRank?.PointsWrong ?? 0}
                isOver={weekStatus === "Complete"}
                max={myWeeklyRank?.PointsTotal ?? 0}
                transitionName="weeklyPointsEarned"
                type="Points"
              />
              <ProgressChart
                correct={myWeeklyRank?.GamesCorrect ?? 0}
                incorrect={myWeeklyRank?.GamesWrong ?? 0}
                isOver={weekStatus === "Complete"}
                max={myWeeklyRank?.GamesTotal ?? 0}
                transitionName="weeklyGamesCorrect"
                type="Games"
              />
            </div>
            {!!myWeeklyRank && (
              <div className="-order-1 md:order-none w-full px-3 pb-2 text-center md:text-right">
                <ShareButton
                  imageUrl={`/api/share/week/${selectedWeek}`}
                  label="Share my result"
                  text={buildWeekResultShareText(selectedWeek, myWeeklyRank.Rank, myWeeklyRank.Tied === 1)}
                  title={`My week ${selectedWeek} result`}
                />
              </div>
            )}
            <RetryableSection title="the weekly rankings">
              <Crossfade>
                <WeeklyRankingsTable selectedWeek={selectedWeek} />
              </Crossfade>
            </RetryableSection>
          </div>
        </PageContent>
      </div>
    </WeekTransition>
  );
};

const WeeklyRankings: FC<PageProps<"/weekly">> = (props) => (
  <PageTransition>
    <Suspense fallback={<WeeklyLoading />}>
      <WeeklyRankingsPageBody {...props} />
    </Suspense>
  </PageTransition>
);

export default WeeklyRankings;
