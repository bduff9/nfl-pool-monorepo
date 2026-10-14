import type { FC } from "react";
import { PiFootballDuotone } from "react-icons/pi";
import "server-only";

import { HandedOffAlerts } from "@/components/CustomHead/CustomHead.client";
import PageContent from "@/components/PageContent/PageContent";

// Shown while a route that was not prefetched loads. Laid out like the pages (alerts, then PageContent), so the alerts
// row and the sidebar trigger stay where they are instead of disappearing until the route's own skeleton arrives.
const PageLoading: FC = () => (
  <div className="h-full flex flex-col md:mx-3" data-testid="route-loading">
    <HandedOffAlerts />
    <PageContent>
      <div className="flex h-full w-full items-center justify-center py-24">
        <PiFootballDuotone aria-hidden="true" className="size-10 animate-spin text-primary" />
        <span className="sr-only">Loading&hellip;</span>
      </div>
    </PageContent>
  </div>
);

export default PageLoading;
