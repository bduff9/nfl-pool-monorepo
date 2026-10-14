import { Skeleton } from "@nfl-pool-monorepo/ui/components/skeleton";
import "server-only";

import type { FC } from "react";

import { HandedOffAlerts } from "@/components/CustomHead/CustomHead.client";
import PageContent from "@/components/PageContent/PageContent";

const HeadToHeadLoader: FC = () => {
  return (
    <div className="h-full flex flex-col md:mx-3" data-testid="route-loading">
      <HandedOffAlerts />
      <PageContent className="px-3 pt-5 pb-4 md:px-5 md:pt-3">
        <h2 className="text-4xl font-semibold tracking-tight mb-6">Head-to-Head</h2>
        <Skeleton className="h-12 w-full max-w-xl mb-6" />
        <div className="grid grid-cols-2 gap-4 max-w-xl mb-6">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-72 w-full" />
      </PageContent>
    </div>
  );
};

export default HeadToHeadLoader;
