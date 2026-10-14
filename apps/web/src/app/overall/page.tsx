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
import { LuBadgeAlert } from "react-icons/lu";
import "server-only";

import { type FC, Suspense } from "react";

import RankingsTable from "@/app/RankingsTable";
import CustomHead from "@/components/CustomHead/CustomHead";
import { OverallDashboardResults, OverallDashboardTitle } from "@/components/OverallDashboard/OverallDashboard.client";
import PageContent from "@/components/PageContent/PageContent";
import ProgressChart from "@/components/ProgressChart/ProgressChart";
import RankingPieChart from "@/components/RankingPieChart/RankingPieChart";
import RetryableSection from "@/components/RetryableSection/RetryableSection";
import ScenariosDashboard from "@/components/ScenariosDashboard/ScenariosDashboard";
import ScoreboardLiveRefresh from "@/components/ScoreboardLiveRefresh/ScoreboardLiveRefresh";
import SectionError from "@/components/SectionError/SectionError.client";
import Crossfade from "@/components/ViewTransitions/Crossfade";
import PageTransition from "@/components/ViewTransitions/PageTransition";
import { WeekLink } from "@/components/WeekLink/WeekLink";
import { requireRegistered } from "@/lib/auth";
import { getGamesForWeekScoreboardCached } from "@/server/loaders/game";
import {
  getMyOverallRank,
  getOverallMvCount,
  getOverallMvTiedCount,
  getOverallRankings,
} from "@/server/loaders/overallMv";
import { getCurrentUser } from "@/server/loaders/user";
import { getCurrentWeekCached, getSeasonStatus } from "@/server/loaders/week";

import OverallLoading from "./loading";

const TITLE = "Overall Ranks";

export const metadata: Metadata = {
  title: TITLE,
};

const renderMissedGamesCell = (row: { GamesMissed: number }) => (
  <TableCell title={`Missed games: ${row.GamesMissed}`}>
    {row.GamesMissed > 0 && <LuBadgeAlert className="text-red-700 mx-auto size-5" />}
  </TableCell>
);

const OverallRankingsTable: FC = async () => {
  const [overallRankings, user] = await Promise.all([getOverallRankings(), getCurrentUser()]);

  return (
    <RankingsTable
      currentUserId={user.UserID}
      extraHeadings={["Missed Games?"]}
      renderExtraCells={renderMissedGamesCell}
      rows={overallRankings}
    />
  );
};

// fallow-ignore-next-line complexity -- long-standing page body; this change only adds the Still In Play panel and rebalances chart columns
const OverallRankingsPageBody: FC<PageProps<"/overall">> = async () => {
  const redirectUrl = await requireRegistered();

  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  const seasonStatusPromise = getSeasonStatus();
  const myOverallRankPromise = getMyOverallRank();
  const overallTotalCountPromise = getOverallMvCount();
  const overallTiedCountPromise = getOverallMvTiedCount();
  const [seasonStatus, myOverallRank, overallTotalCount, overallTiedCount] = await Promise.all([
    seasonStatusPromise,
    myOverallRankPromise,
    overallTotalCountPromise,
    overallTiedCountPromise,
  ]);

  if (overallTotalCount === 0) {
    return redirect("/");
  }

  const myPlace = `${myOverallRank?.Tied ? "T" : ""}${myOverallRank?.Rank}`;
  const me = myOverallRank?.Rank ?? 0;
  const aheadOfMe = me - 1;
  const behindMe = overallTotalCount - me - overallTiedCount;

  const currentWeekGames = await getGamesForWeekScoreboardCached(await getCurrentWeekCached());
  const hasLiveGames =
    seasonStatus === "In Progress" &&
    currentWeekGames.some((game) => game.GameStatus !== "Pregame" && game.GameStatus !== "Final");

  return (
    <div className="h-full flex flex-col md:mx-3">
      <CustomHead title={TITLE} />
      <ScoreboardLiveRefresh enabled={hasLiveGames} />
      <PageContent className="pt-0 md:pt-3 pb-4">
        <div className="flex flex-wrap items-start">
          <div className="hidden md:inline-block w-[25%] text-center h-[205px]">
            <OverallDashboardTitle />
            <RankingPieChart
              data={[
                {
                  fill: "var(--color-red-700)",
                  myPlace,
                  name: "ahead of me",
                  total: overallTotalCount,
                  value: aheadOfMe,
                },
                {
                  fill: "var(--color-green-700)",
                  myPlace,
                  name: "behind me",
                  total: overallTotalCount,
                  value: behindMe,
                },
                {
                  fill: "var(--color-amber-600)",
                  myPlace,
                  name: "tied with me",
                  total: overallTotalCount,
                  value: overallTiedCount,
                },
              ]}
              transitionName="overallRankingPieChart"
            />
          </div>
          <div className="mt-4 block md:hidden">
            <WeekLink className="inline-block py-2.5" href="/">
              &laquo; Back to Dashboard
            </WeekLink>
          </div>
          <SectionError title="Scenarios">
            <Suspense fallback={null}>
              <ScenariosDashboard scope="overall" />
            </Suspense>
          </SectionError>
          <div className="hidden md:inline-block flex-1 px-3">
            <OverallDashboardResults className="mb-4 text-center" />
            <ProgressChart
              correct={myOverallRank?.PointsEarned ?? 0}
              incorrect={myOverallRank?.PointsWrong ?? 0}
              isOver={seasonStatus === "Complete"}
              max={myOverallRank?.PointsTotal ?? 0}
              transitionName="overallPointsEarned"
              type="Points"
            />
            <ProgressChart
              correct={myOverallRank?.GamesCorrect ?? 0}
              incorrect={myOverallRank?.GamesWrong ?? 0}
              isOver={seasonStatus === "Complete"}
              max={myOverallRank?.GamesTotal ?? 0}
              transitionName="overallGamesCorrect"
              type="Games"
            />
          </div>
          <RetryableSection title="the overall rankings">
            <Crossfade>
              <OverallRankingsTable />
            </Crossfade>
          </RetryableSection>
        </div>
      </PageContent>
    </div>
  );
};

const OverallRankings: FC<PageProps<"/overall">> = (props) => (
  <PageTransition>
    <Suspense fallback={<OverallLoading />}>
      <OverallRankingsPageBody {...props} />
    </Suspense>
  </PageTransition>
);

export default OverallRankings;
