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

import type { Metadata, Route } from "next";
import { redirect } from "next/navigation";
import "server-only";

import { type FC, Suspense } from "react";

import MakeSurvivorPickClient from "@/components/MakeSurvivorPickClient/MakeSurvivorPickClient";
import PageTransition from "@/components/ViewTransitions/PageTransition";
import { requireRegistered } from "@/lib/auth";
import { withWeek } from "@/lib/weekSearchParams";
import { getGamesForWeekCached, getWeekInProgress } from "@/server/loaders/game";
import { getIsAliveInSurvivor, getMySurvivorPicks } from "@/server/loaders/survivor";
import { getTeamsOnBye } from "@/server/loaders/team";
import { getCurrentUser } from "@/server/loaders/user";
import { getSelectedWeekFromParams } from "@/server/loaders/week";

import CustomHead from "../../../components/CustomHead/CustomHead";
import PageContent from "../../../components/PageContent/PageContent";
import SurvivorSetLoading from "./loading";

export const metadata: Metadata = {
  title: { absolute: "Make Survivor Picks" },
};

// fallow-ignore-next-line complexity -- redirect preconditions only; the elimination check was reordered, not added
const SetSurvivorPageBody: FC<PageProps<"/survivor/set">> = async ({ searchParams }) => {
  const redirectUrl = await requireRegistered();

  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  const selectedWeekPromise = getSelectedWeekFromParams(searchParams);
  const isAlivePromise = getIsAliveInSurvivor();
  const weekInProgressPromise = getWeekInProgress();
  const survivorPicksPromise = getMySurvivorPicks();
  const userPromise = getCurrentUser();

  const [selectedWeek, isAlive, weekInProgress, survivorPicks, user] = await Promise.all([
    selectedWeekPromise,
    isAlivePromise,
    weekInProgressPromise,
    survivorPicksPromise,
    userPromise,
  ]);

  const gamesPromise = getGamesForWeekCached(selectedWeek);
  const teamsOnByePromise = getTeamsOnBye(selectedWeek);

  const [games, teamsOnBye] = await Promise.all([gamesPromise, teamsOnByePromise]);

  // An eliminated survivor player is bounced to the survivor view with an explanation
  // regardless of which week they aimed for. Observers (not playing survivor) keep the
  // original silent redirects below.
  if (!isAlive && user.UserPlaysSurvivor === 1) {
    return redirect(withWeek("/survivor/view?eliminated=1" as Route, selectedWeek));
  }

  if (weekInProgress && selectedWeek <= weekInProgress) {
    return redirect(withWeek("/survivor/view", selectedWeek));
  }

  if (!isAlive) {
    return redirect("/");
  }

  return (
    <PageTransition>
      <div className="h-full flex flex-col md:mx-3">
        <CustomHead title="Make Survivor Picks" />
        <PageContent className="pt-5 md:pt-3 pb-4">
          <MakeSurvivorPickClient
            games={games}
            survivorPicks={survivorPicks}
            teamsOnBye={teamsOnBye}
            week={selectedWeek}
            weekInProgress={weekInProgress}
          />
        </PageContent>
      </div>
    </PageTransition>
  );
};

const SetSurvivorPage: FC<PageProps<"/survivor/set">> = (props) => (
  <Suspense fallback={<SurvivorSetLoading />}>
    <SetSurvivorPageBody {...props} />
  </Suspense>
);

export default SetSurvivorPage;
