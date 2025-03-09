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
import { Suspense } from "react";

import CustomHead from "@/components/CustomHead/CustomHead";
import OverallDashboard from "@/components/OverallDashboard/OverallDashboard";
import SurvivorDashboard from "@/components/SurvivorDashboard/SurvivorDashboard";
import DashboardLoader from "@/components/WeeklyDashboard/DashboardLoader";
import WeeklyDashboard from "@/components/WeeklyDashboard/WeeklyDashboard";
import { requireRegistered } from "@/lib/auth";
import type { NP } from "@/lib/types";

const TITLE = "My Dashboard";

export const metadata: Metadata = {
  title: TITLE,
};

const Dashboard: NP = async () => {
  const redirectUrl = await requireRegistered();

  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  return (
    <div className="h-full flex flex-wrap mx-3">
      <CustomHead title={TITLE} />
      <div className="bg-gray-100/80 text-dark my-3 mx-2 pt-5 md:pt-3 min-h-screen pb-4 grow shrink-0">
        <div className="grid grid-cols-3 gap-3 min-h-screen">
          <Suspense fallback={<DashboardLoader title="Weekly Rank" />}>
            <WeeklyDashboard />
          </Suspense>
          <Suspense fallback={<DashboardLoader title="Overall Rank" />}>
            <OverallDashboard />
          </Suspense>
          <Suspense fallback={<DashboardLoader title="Survivor Pool" />}>
            <SurvivorDashboard />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

// ts-prune-ignore-next
export default Dashboard;
