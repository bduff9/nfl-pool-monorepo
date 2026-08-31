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
import { redirect } from "next/navigation";
import { type FC, Suspense } from "react";
import "server-only";

import CustomHead from "@/components/CustomHead/CustomHead";
import OverallDashboard from "@/components/OverallDashboard/OverallDashboard";
import PageContent from "@/components/PageContent/PageContent";
import SurvivorDashboard from "@/components/SurvivorDashboard/SurvivorDashboard";
import Crossfade from "@/components/ViewTransitions/Crossfade";
import PageTransition from "@/components/ViewTransitions/PageTransition";
import DashboardLoader from "@/components/WeeklyDashboard/DashboardLoader";
import WeeklyDashboard from "@/components/WeeklyDashboard/WeeklyDashboard";
import { requireRegistered } from "@/lib/auth";
import { getSelectedWeekFromParams } from "@/server/loaders/week";

import PageLoading from "./loading";

const TITLE = "My Dashboard";

export const metadata: Metadata = {
  title: TITLE,
};

const DashboardPageBody: FC<PageProps<"/">> = async ({ searchParams }) => {
  const redirectUrl = await requireRegistered();

  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  const selectedWeek = await getSelectedWeekFromParams(searchParams);

  return (
    <PageTransition>
      <div className="h-full flex flex-col md:mx-3">
        <CustomHead title={TITLE} />
        <PageContent className="pt-5 md:pt-3 pb-4 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 min-h-screen">
            <Suspense fallback={<DashboardLoader title="Weekly Rank" />}>
              <Crossfade>
                <WeeklyDashboard selectedWeek={selectedWeek} />
              </Crossfade>
            </Suspense>
            <Suspense fallback={<DashboardLoader title="Overall Rank" />}>
              <Crossfade>
                <OverallDashboard />
              </Crossfade>
            </Suspense>
            <Suspense fallback={<DashboardLoader title="Survivor Pool" />}>
              <Crossfade>
                <SurvivorDashboard selectedWeek={selectedWeek} />
              </Crossfade>
            </Suspense>
          </div>
        </PageContent>
      </div>
    </PageTransition>
  );
};

const Dashboard: FC<PageProps<"/">> = (props) => (
  <Suspense fallback={<PageLoading />}>
    <DashboardPageBody {...props} />
  </Suspense>
);

// ts-prune-ignore-next
export default Dashboard;
