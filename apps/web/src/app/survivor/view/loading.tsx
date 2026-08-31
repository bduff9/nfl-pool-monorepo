import { Skeleton } from "@nfl-pool-monorepo/ui/components/skeleton";
import type { FC } from "react";
import "server-only";

import PageContent from "@/components/PageContent/PageContent";
import ProgressChartLoader from "@/components/ProgressChart/ProgressChartLoader";

const ViewSurvivorLoading: FC = () => (
  <div className="h-full flex flex-col md:mx-3" data-testid="route-loading">
    <PageContent className="pt-5 md:pt-3 pb-4">
      <div className="hidden md:flex">
        <Skeleton className="mx-auto size-[180px] rounded-full bg-muted" />
        <div className="w-2/3 px-3 pt-8">
          <ProgressChartLoader />
          <ProgressChartLoader />
        </div>
      </div>
      <Skeleton className="mt-4 h-[60vh] w-full bg-muted" />
    </PageContent>
  </div>
);

export default ViewSurvivorLoading;
