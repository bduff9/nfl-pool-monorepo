import { Skeleton } from "@nfl-pool-monorepo/ui/components/skeleton";
import type { FC } from "react";
import "server-only";

import PageContent from "@/components/PageContent/PageContent";

const UsersLoading: FC = () => (
  <div className="h-full flex flex-col md:mx-3" data-testid="route-loading">
    <PageContent className="pt-5 md:pt-3 pb-4">
      <Skeleton className="mb-4 h-9 w-48 bg-gray-300" />
      <Skeleton className="h-96 w-full bg-gray-300" />
    </PageContent>
  </div>
);

export default UsersLoading;
