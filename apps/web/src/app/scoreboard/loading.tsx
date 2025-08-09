/*******************************************************************************
 * NFL Confidence Pool FE - the frontend implementation of an NFL confidence pool.
 * Copyright (C) 2015-present Brian Duffey
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see {http://www.gnu.org/licenses/}.
 * Home: https://asitewithnoname.com/
 */
import { Skeleton } from "@nfl-pool-monorepo/ui/components/skeleton";
import { cn } from "@nfl-pool-monorepo/utils/styles";
import { type FC, Fragment } from "react";

const TeamLoader: FC = () => (
  <>
    <div>
      <Skeleton className="size-[70px] bg-gray-300" />
    </div>
    <div className={cn("flex-grow flex items-center ps-5")}>
      <Skeleton className="hidden md:inline-block h-6 w-[200px] bg-gray-300" />
      <Skeleton className="inline-block md:hidden h-6 w-8 bg-gray-300" />
    </div>
    <div className="w-full"></div>
  </>
);

const GameLoader: FC = () => (
  <div className="mb-3">
    <div className={cn("p-3 flex bg-gray-100 border border-gray-300")}>
      <div className={cn("flex flex-shrink flex-col md:flex-row flex-wrap")}>
        <TeamLoader />
        <TeamLoader />
      </div>
      <div className={cn("text-center pt-4 flex-grow")}>
        <Skeleton className="inline-block h-7 w-36 bg-gray-300" />
      </div>
    </div>
  </div>
);

const ScoreboardLoader: FC = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="bg-gray-100/80 text-black mx-2 pt-5 md:pt-3 min-h-screen pb-4 flex-1">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-5 px-3">
          {Array.from({ length: 16 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: This is a loader and the key is not important
            <Fragment key={i}>
              {[0, 1, 15].includes(i) && (
                <div className={cn("col-span-full text-left font-bold mt-3")}>
                  <Skeleton className="h-6 w-full md:w-96 bg-gray-300" />
                </div>
              )}
              <GameLoader />
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScoreboardLoader;
