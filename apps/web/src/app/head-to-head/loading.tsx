import { Skeleton } from "@nfl-pool-monorepo/ui/components/skeleton";
import "server-only";

import type { FC } from "react";

import PageContent from "@/components/PageContent/PageContent";

const HeadToHeadLoader: FC = () => {
  return (
    <div className="h-full flex" data-testid="route-loading">
      <PageContent className="mx-2 pt-0 md:pt-3 pb-4">
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
