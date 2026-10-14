import { Skeleton } from "@nfl-pool-monorepo/ui/components/skeleton";
import type { FC } from "react";
import "server-only";

import PicksTableSkeleton from "@/app/picks/PicksTableSkeleton";
import { HandedOffAlerts } from "@/components/CustomHead/CustomHead.client";
import PageContent from "@/components/PageContent/PageContent";

const MakePicksLoading: FC = () => (
  <div className="h-full flex flex-col md:mx-3" data-testid="route-loading">
    <HandedOffAlerts />
    <PageContent className="pt-3 pb-(--actions-bar-height)">
      <Skeleton className="mb-4 h-8 w-64 bg-muted" />
      <PicksTableSkeleton pointsSkeletonClassName="mx-auto h-8 w-8 bg-muted" />
    </PageContent>
  </div>
);

export default MakePicksLoading;
