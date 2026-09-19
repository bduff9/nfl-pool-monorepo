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
import PageContent from "@/components/PageContent/PageContent";
import RetryableSection from "@/components/RetryableSection/RetryableSection";
import ScoreboardGamesList from "@/components/ScoreboardGamesList/ScoreboardGamesList";
import ScoreboardLiveRefresh from "@/components/ScoreboardLiveRefresh/ScoreboardLiveRefresh";
import Crossfade from "@/components/ViewTransitions/Crossfade";
import PageTransition from "@/components/ViewTransitions/PageTransition";
import { requireRegistered } from "@/lib/auth";
import { getGamesForWeekScoreboardCached } from "@/server/loaders/game";
import { getSelectedWeekFromParams } from "@/server/loaders/week";

import ScoreboardLoader from "./loading";

const TITLE = "Scoreboard";

export const metadata: Metadata = {
  title: TITLE,
};

type ScoreboardGamesProps = {
  selectedWeek: number;
};

const ScoreboardGames: FC<ScoreboardGamesProps> = async ({ selectedWeek }) => {
  const games = await getGamesForWeekScoreboardCached(selectedWeek);
  const hasLiveGames = games.some((game) => game.GameStatus !== "Pregame" && game.GameStatus !== "Final");

  return (
    <>
      <ScoreboardLiveRefresh enabled={hasLiveGames} />
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-5 px-3">
        <ScoreboardGamesList games={games} />
      </div>
    </>
  );
};

const ScoreboardPageBody: FC<PageProps<"/scoreboard">> = async ({ searchParams }) => {
  const redirectUrl = await requireRegistered();

  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  const selectedWeek = await getSelectedWeekFromParams(searchParams);

  return (
    <PageTransition>
      <div className="h-full flex flex-col md:mx-3">
        <CustomHead title={TITLE} />
        <PageContent className="pt-5 md:pt-3 pb-4">
          <RetryableSection title="the scoreboard">
            <Crossfade>
              <ScoreboardGames selectedWeek={selectedWeek} />
            </Crossfade>
          </RetryableSection>
        </PageContent>
      </div>
    </PageTransition>
  );
};

const Scoreboard: FC<PageProps<"/scoreboard">> = (props) => (
  <Suspense fallback={<ScoreboardLoader />}>
    <ScoreboardPageBody {...props} />
  </Suspense>
);

export default Scoreboard;
