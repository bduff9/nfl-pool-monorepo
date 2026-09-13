import { Skeleton } from "@nfl-pool-monorepo/ui/components/skeleton";
import "server-only";

import type { FC } from "react";

import PageContent from "@/components/PageContent/PageContent";

const HistoryLoader: FC = () => {
  return (
    <div className="h-full flex" data-testid="route-loading">
      <PageContent className="mx-2 pt-0 md:pt-3 pb-4">
        <h2 className="text-4xl font-semibold tracking-tight mb-6">Pool History</h2>
        {Array.from({ length: 3 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: This is a loader and the key is not important
          <div className="mb-8" key={`history-loader-${i}`}>
            <Skeleton className="h-10 w-32 mb-4" />
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
          </div>
        ))}
      </PageContent>
    </div>
  );
};

export default HistoryLoader;
