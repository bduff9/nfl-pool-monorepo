import { Skeleton } from "@nfl-pool-monorepo/ui/components/skeleton";
import type { FC } from "react";
import "server-only";

import PageContent from "@/components/PageContent/PageContent";

const ViewAllPicksLoading: FC = () => (
  <div className="h-full flex flex-col md:mx-3" data-testid="route-loading">
    <PageContent className="pt-3">
      <Skeleton className="h-[70vh] w-full bg-gray-300" />
    </PageContent>
  </div>
);

export default ViewAllPicksLoading;
