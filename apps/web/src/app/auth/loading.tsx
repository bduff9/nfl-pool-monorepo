import { Skeleton } from "@nfl-pool-monorepo/ui/components/skeleton";
import type { FC } from "react";
import "server-only";

const AuthLoading: FC = () => (
  <div
    className="bg-card text-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border rounded-lg p-4 shrink-0 grow w-full h-full lg:h-auto lg:w-[50%] xl:w-[33%]"
    data-testid="route-loading"
  >
    <h1 className="text-center font-medium text-4xl mt-8">NFL Confidence Pool</h1>
    <Skeleton className="mt-8 h-10 w-full bg-muted" />
    <Skeleton className="mt-3 h-10 w-full bg-muted" />
    <Skeleton className="mt-6 h-10 w-full bg-muted" />
  </div>
);

export default AuthLoading;
