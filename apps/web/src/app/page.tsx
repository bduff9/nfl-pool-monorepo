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
import type { Metadata } from "next";
import { type FC, Suspense } from "react";
import "server-only";

import { requireSelectedWeek } from "@/app/requireSelectedWeek";
import CustomHead from "@/components/CustomHead/CustomHead";
import InstallAppPrompt from "@/components/InstallAppPrompt/InstallAppPrompt.client";
import OverallDashboard from "@/components/OverallDashboard/OverallDashboard";
import PageContent from "@/components/PageContent/PageContent";
import SectionError from "@/components/SectionError/SectionError.client";
import SurvivorDashboard from "@/components/SurvivorDashboard/SurvivorDashboard";
import Crossfade from "@/components/ViewTransitions/Crossfade";
import PageTransition from "@/components/ViewTransitions/PageTransition";
import SuspenseReveal from "@/components/ViewTransitions/SuspenseReveal";
import WeekTransition from "@/components/ViewTransitions/WeekTransition";
import DashboardLoader from "@/components/WeeklyDashboard/DashboardLoader";
import WeeklyDashboard from "@/components/WeeklyDashboard/WeeklyDashboard";

const TITLE = "My Dashboard";

export const metadata: Metadata = {
  title: TITLE,
};

// The same names the real dashboards use, so the skeletons morph to and from the detail pages
const weeklyLoader = (
  <DashboardLoader
    title="Weekly Rank"
    transitionNames={{
      gamesChart: "weeklyGamesCorrect",
      pointsChart: "weeklyPointsEarned",
      rankingPieChart: "weeklyRankingPieChart",
      rankTitle: "weeklyRankTitle",
    }}
  />
);

const overallLoader = (
  <DashboardLoader
    title="Overall Rank"
    transitionNames={{
      gamesChart: "overallGamesCorrect",
      pointsChart: "overallPointsEarned",
      rankingPieChart: "overallRankingPieChart",
      rankTitle: "overallRankTitle",
    }}
  />
);

const survivorLoader = (
  <DashboardLoader
    title="Survivor Pool"
    transitionNames={{ gamesChart: "survivorOverallStatus", pointsChart: "survivorWeekStatus" }}
  />
);

const DashboardPageBody: FC<PageProps<"/">> = async ({ searchParams }) => {
  const selectedWeek = await requireSelectedWeek(searchParams);

  return (
    <WeekTransition key={selectedWeek}>
      <div className="h-full flex flex-col md:mx-3">
        <CustomHead title={TITLE} />
        <PageContent className="pt-5 md:pt-3 pb-4 w-full">
          <InstallAppPrompt />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 min-h-dvh">
            <SectionError title="Weekly Rank">
              <Suspense fallback={weeklyLoader}>
                <Crossfade>
                  <WeeklyDashboard selectedWeek={selectedWeek} />
                </Crossfade>
              </Suspense>
            </SectionError>
            <SectionError title="Overall Rank">
              <Suspense fallback={overallLoader}>
                <Crossfade>
                  <OverallDashboard />
                </Crossfade>
              </Suspense>
            </SectionError>
            <SectionError title="Survivor Pool">
              <Suspense fallback={survivorLoader}>
                <Crossfade>
                  <SurvivorDashboard selectedWeek={selectedWeek} />
                </Crossfade>
              </Suspense>
            </SectionError>
          </div>
        </PageContent>
      </div>
    </WeekTransition>
  );
};

const DashboardSkeleton: FC = () => (
  <div className="h-full flex flex-col md:mx-3">
    <PageContent className="pt-5 md:pt-3 pb-4 w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 min-h-dvh">
        {weeklyLoader}
        {overallLoader}
        {survivorLoader}
      </div>
    </PageContent>
  </div>
);

const Dashboard: FC<PageProps<"/">> = (props) => (
  <PageTransition>
    <SuspenseReveal fallback={<DashboardSkeleton />}>
      <DashboardPageBody {...props} />
    </SuspenseReveal>
  </PageTransition>
);

// ts-prune-ignore-next
export default Dashboard;
