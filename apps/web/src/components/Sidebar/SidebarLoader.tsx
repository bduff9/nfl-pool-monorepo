"use client";
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
import { cn } from "@nfl-pool-monorepo/utils/styles";
import { type FC, useContext } from "react";
import { LuMenu } from 'react-icons/lu';
import Skeleton from "react-loading-skeleton";

import { TitleContext } from "@/lib/context";

const SidebarLoader: FC = () => {
  const durationInSeconds = 2.25;
  const [title] = useContext(TitleContext);

  return (
    <>
      <div className={cn("md:hidden print:hidden absolute text-center top-0 left-0 right-0 bg-black text-gray-100")}>
        <span className={cn("absolute cursor-pointer top-[5px] left-[10px] text-gray-100 z-1")}>
          <LuMenu className="size-6" />
        </span>
        <h1 className="m-0">{title}</h1>
      </div>
      <div
        className={cn(
          "fixed top-0 bottom-0 left-0 hidden pt-2 h-full md:block print:hidden",
          "col-10",
          "col-sm-3",
          "col-lg-2",
        )}
      >
        {/* Welcome, NAME */}
        <div className="text-center mb-4">
          <Skeleton duration={durationInSeconds} height={26} width={150} />
        </div>
        {/* Week Picker */}
        <Skeleton duration={durationInSeconds} className="mb-4" height={46} />
        {/* Dashboard */}
        <div className="mb-3">
          <Skeleton duration={durationInSeconds} height={25} width={136} />
        </div>
        {/* Picks */}
        <div className="mb-3">
          <Skeleton duration={durationInSeconds} height={25} width={85} />
        </div>
        {/* Survivor */}
        <div className="mb-3">
          <Skeleton duration={durationInSeconds} height={25} width={136} />
        </div>
        {/* NFL Scoreboard */}
        <div className="mb-3">
          <Skeleton duration={durationInSeconds} height={25} width={238} />
        </div>
        {/* My Account */}
        <div className="mb-3">
          <Skeleton duration={durationInSeconds} height={25} width={170} />
        </div>
        {/* Help */}
        <div className="mb-3">
          <Skeleton duration={durationInSeconds} height={25} width={68} />
        </div>
        {/* Signout */}
        <div className="mb-3">
          <Skeleton duration={durationInSeconds} height={25} width={119} />
        </div>
      </div>
    </>
  );
};

export default SidebarLoader;
