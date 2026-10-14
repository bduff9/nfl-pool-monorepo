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

import "server-only";

import { Skeleton } from "@nfl-pool-monorepo/ui/components/skeleton";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import { type FC, Fragment, Suspense } from "react";

import { HandedOffAlerts } from "@/components/CustomHead/CustomHead.client";
import PageContent from "@/components/PageContent/PageContent";
import { HandedOffScoreboard } from "@/components/ScoreboardGameCard/HandedOffGames";
import ScoreboardGameCardSkeleton from "@/components/ScoreboardGameCard/ScoreboardGameCardSkeleton";

const ScoreboardSkeleton: FC = () => {
  return (
    <div className="h-full flex flex-col md:mx-3" data-testid="route-loading">
      <HandedOffAlerts />
      <PageContent className="pt-5 md:pt-3 pb-4">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-5 px-3">
          {Array.from({ length: 16 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: This is a loader and the key is not important
            <Fragment key={i}>
              {[0, 1, 15].includes(i) && (
                <div className={cn("col-span-full text-left font-bold mt-3")}>
                  <Skeleton className="h-6 w-full md:w-96 bg-muted" />
                </div>
              )}
              <ScoreboardGameCardSkeleton />
            </Fragment>
          ))}
        </div>
      </PageContent>
    </div>
  );
};

// On the way back from a game page this shows the list the scoreboard last rendered, so the game card moves back
// into its row; otherwise (and while prerendering, where the week in the URL is unknown) the skeleton
const ScoreboardLoader: FC = () => (
  <Suspense fallback={<ScoreboardSkeleton />}>
    <HandedOffScoreboard fallback={<ScoreboardSkeleton />} />
  </Suspense>
);

export default ScoreboardLoader;
