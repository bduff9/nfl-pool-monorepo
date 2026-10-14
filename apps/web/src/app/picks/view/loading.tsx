import { Skeleton } from "@nfl-pool-monorepo/ui/components/skeleton";
import type { FC } from "react";
import "server-only";

import PicksTableSkeleton from "@/app/picks/PicksTableSkeleton";
import { HandedOffAlerts } from "@/components/CustomHead/CustomHead.client";
import PageContent from "@/components/PageContent/PageContent";

const ViewPicksLoading: FC = () => (
  <div className="h-full flex flex-col md:mx-3" data-testid="route-loading">
    <HandedOffAlerts />
    <PageContent className="pb-4">
      <Skeleton className="mb-4 h-32 w-full bg-muted" />
      <PicksTableSkeleton pointsSkeletonClassName="mx-auto h-6 w-8 bg-muted" />
    </PageContent>
  </div>
);

export default ViewPicksLoading;
