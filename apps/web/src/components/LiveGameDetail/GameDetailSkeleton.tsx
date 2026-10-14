import { Skeleton } from "@nfl-pool-monorepo/ui/components/skeleton";
import { type FC, Suspense } from "react";

import { HandedOffAlerts } from "@/components/CustomHead/CustomHead.client";
import PageContent from "@/components/PageContent/PageContent";
import { RouteHandedOffGameCard } from "@/components/ScoreboardGameCard/HandedOffGames";
import ScoreboardGameCardSkeleton from "@/components/ScoreboardGameCard/ScoreboardGameCardSkeleton";

/** Loading state of LiveGameDetail, placed in the page grid like it: the win probability chart and scoring plays. */
export const LiveGameDetailSkeleton: FC = () => (
  <>
    <div className="mb-5 md:col-start-2 md:row-start-1">
      <Skeleton className="mb-1 h-6 w-36 bg-muted" />
      <Skeleton className="h-24 md:h-32 bg-muted" />
      <Skeleton className="mt-1 ms-auto h-4 w-24 bg-muted" />
    </div>
    <div className="mb-5 md:col-span-2">
      <Skeleton className="mb-1 h-6 w-36 bg-muted" />
      <Skeleton className="h-40 bg-muted" />
    </div>
  </>
);

/** Loading state of the game page, laid out like it: back link, the game's scoreboard card, then the live detail. */
const GameDetailSkeleton: FC = () => (
  <div className="h-full flex flex-col md:mx-3" data-testid="route-loading">
    <HandedOffAlerts />
    <PageContent className="pt-5 md:pt-3 pb-4">
      <div className="px-3">
        <div className="py-2.5">
          <Skeleton className="h-6 w-44 bg-muted" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
          <Suspense fallback={<ScoreboardGameCardSkeleton />}>
            <RouteHandedOffGameCard />
          </Suspense>
          <LiveGameDetailSkeleton />
        </div>
      </div>
    </PageContent>
  </div>
);

export default GameDetailSkeleton;
