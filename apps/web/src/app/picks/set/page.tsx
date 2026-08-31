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
import "server-only";

import { type FC, Suspense } from "react";

import CustomHead from "@/components/CustomHead/CustomHead";
import MakePicksClient from "@/components/MakePicksClient/MakePicksClient";
import PageContent from "@/components/PageContent/PageContent";
import PageTransition from "@/components/ViewTransitions/PageTransition";
import { requireRegistered } from "@/lib/auth";
import { withWeek } from "@/lib/weekSearchParams";
import { getMyWeeklyPicks } from "@/server/loaders/pick";
import { getMyTiebreaker } from "@/server/loaders/tiebreaker";
import { getSelectedWeekFromParams } from "@/server/loaders/week";

import MakePicksLoading from "./loading";

const TITLE = "Make Weekly Picks";

export const metadata: Metadata = {
  title: TITLE,
};

const MakePicksPageBody: FC<PageProps<"/picks/set">> = async ({ searchParams }) => {
  const redirectUrl = await requireRegistered();

  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  const selectedWeek = await getSelectedWeekFromParams(searchParams);
  const tiebreakerPromise = getMyTiebreaker(selectedWeek);
  const myWeeklyPicksPromise = getMyWeeklyPicks(selectedWeek);

  const [tiebreaker, myWeeklyPicks] = await Promise.all([tiebreakerPromise, myWeeklyPicksPromise]);

  if (!tiebreaker) {
    return redirect("/");
  }

  if (tiebreaker?.TiebreakerHasSubmitted === 1) {
    return redirect(withWeek("/picks/view", selectedWeek));
  }

  return (
    <PageTransition>
      <div className="h-full flex flex-col md:mx-3">
        <CustomHead title={`Make week ${selectedWeek} picks`} />
        <PageContent className="pt-3 pb-[70px]">
          <MakePicksClient
            key={selectedWeek}
            selectedWeek={selectedWeek}
            tiebreaker={tiebreaker}
            weeklyPicks={myWeeklyPicks}
          />
        </PageContent>
      </div>
    </PageTransition>
  );
};

const MakePicks: FC<PageProps<"/picks/set">> = (props) => (
  <Suspense fallback={<MakePicksLoading />}>
    <MakePicksPageBody {...props} />
  </Suspense>
);

export default MakePicks;
