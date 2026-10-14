import { Skeleton } from "@nfl-pool-monorepo/ui/components/skeleton";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { FC } from "react";

const TeamLoader: FC = () => (
  <>
    <div>
      <Skeleton className="size-[70px] bg-muted" />
    </div>
    <div className={cn("flex-grow flex items-center ps-5")}>
      <Skeleton className="hidden md:inline-block h-6 w-[200px] bg-muted" />
      <Skeleton className="inline-block md:hidden h-6 w-8 bg-muted" />
    </div>
    <div className="w-full"></div>
  </>
);

/** Loading state of ScoreboardGameCard, at the same size, with the bottom margin the card has on both pages. */
const ScoreboardGameCardSkeleton: FC = () => (
  <div className="mb-3">
    <div className={cn("p-3 flex bg-muted border")}>
      <div className={cn("flex flex-shrink flex-col md:flex-row flex-wrap")}>
        <TeamLoader />
        <TeamLoader />
      </div>
      <div className={cn("text-center pt-4 flex-grow")}>
        <Skeleton className="inline-block h-7 w-36 bg-muted" />
      </div>
    </div>
  </div>
);

export default ScoreboardGameCardSkeleton;
