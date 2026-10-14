import { Skeleton } from "@nfl-pool-monorepo/ui/components/skeleton";
import "server-only";

import type { FC } from "react";

import { HandedOffAlerts } from "@/components/CustomHead/CustomHead.client";
import PageContent from "@/components/PageContent/PageContent";

const HistoryLoader: FC = () => {
  return (
    <div className="h-full flex flex-col md:mx-3" data-testid="route-loading">
      <HandedOffAlerts />
      <PageContent className="px-3 pt-5 pb-4 md:px-5 md:pt-3">
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
