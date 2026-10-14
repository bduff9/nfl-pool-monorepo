import { Skeleton } from "@nfl-pool-monorepo/ui/components/skeleton";
import type { FC } from "react";
import "server-only";

import { HandedOffAlerts } from "@/components/CustomHead/CustomHead.client";
import PageContent from "@/components/PageContent/PageContent";
import ProgressChartLoader from "@/components/ProgressChart/ProgressChartLoader";
import SurvivorDashboardIconLoader from "@/components/SurvivorDashboardIcon/SurvivorDashboardIconLoader";

const ViewSurvivorLoading: FC = () => (
  <div className="h-full flex flex-col md:mx-3" data-testid="route-loading">
    <HandedOffAlerts />
    <PageContent className="pt-5 md:pt-3 pb-4">
      <div className="hidden md:flex">
        <div className="w-1/3 text-center h-[205px]">
          <SurvivorDashboardIconLoader transitionName="survivorIcon" />
        </div>
        <div className="w-2/3 px-3 pt-8">
          <ProgressChartLoader transitionName="survivorWeekStatus" />
          <ProgressChartLoader transitionName="survivorOverallStatus" />
        </div>
      </div>
      <Skeleton className="mt-4 h-[60vh] w-full bg-muted" />
    </PageContent>
  </div>
);

export default ViewSurvivorLoading;
