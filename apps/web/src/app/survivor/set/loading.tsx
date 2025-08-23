import { Skeleton } from "@nfl-pool-monorepo/ui/components/skeleton";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { FC } from "react";
import { FaInfoCircle } from "react-icons/fa";
import { PiAtDuotone } from "react-icons/pi";
import "server-only";

import { SURVIVOR_PICK_INSTRUCTIONS } from "@/lib/constants";

type SurvivorTeamLoaderProps = {
  isHome?: boolean;
};

const SurvivorTeamLoader: FC<SurvivorTeamLoaderProps> = ({ isHome = false }) => {
  return (
    <div
      className={cn(
        "border-b border-e border-black relative pt-2 px-2 text-center w-1/2 h-[152px] flex flex-col items-center",
        !isHome && "border-s",
      )}
    >
      <Skeleton className="size-[70px] bg-gray-400" />
      <br />
      <span className="hidden md:inline">
        <Skeleton className={"w-[100px] h-5 bg-gray-400"} />{" "}
      </span>
      <Skeleton className="w-[75px] h-5 bg-gray-400" />
    </div>
  );
};

const SetPicksLoadingPage: FC = () => {
  return (
    <div className="h-full flex">
      <div className="bg-gray-100/80 text-black mx-2 md:pt-3 min-h-screen pb-4 flex-1">
        <div className="flex flex-col min-h-screen">
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-5 text-center">
            {SURVIVOR_PICK_INSTRUCTIONS}
          </h4>
          <div className="flex flex-wrap">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                className={cn("w-full md:w-1/2 lg:w-1/3 2xl:w-1/4 flex flex-wrap pb-3 relative h-48")}
                // biome-ignore lint/suspicious/noArrayIndexKey: This is a loader and the key is not important
                key={`survivor-game-loader-${i}`}
              >
                <div
                  className={cn(
                    "w-full text-muted border border-black flex justify-around overflow-hidden cursor-pointer h-[25px] bg-gray-100 items-center",
                  )}
                >
                  <div>
                    <Skeleton className="w-[136px] h-5 bg-gray-400" />
                  </div>
                  <div>
                    <Skeleton className="w-[100px] h-5 bg-gray-400" />
                  </div>
                  <div>
                    <FaInfoCircle />
                  </div>
                </div>
                <SurvivorTeamLoader />
                <SurvivorTeamLoader isHome />
                <div
                  className={cn(
                    "absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black py-px px-1 bg-gray-100",
                  )}
                >
                  <PiAtDuotone />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetPicksLoadingPage;
