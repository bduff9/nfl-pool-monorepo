import { cn } from "@nfl-pool-monorepo/utils/styles";
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
import Image from "next/image";
import type { FC } from "react";
import { PiFootballHelmetDuotone, PiQuestionMark, PiUserDuotone } from "react-icons/pi";

import type { getMySurvivorPickForWeek } from "@/server/loaders/survivor";
import type { getMySurvivorMv } from "@/server/loaders/survivorMv";

type SurvivorDashboardIconProps = {
  isAlive: boolean;
  isPlaying: boolean;
  lastPick?: NonNullable<Awaited<ReturnType<typeof getMySurvivorMv>>>["lastPickTeam"];
  pickForWeek?: Awaited<ReturnType<typeof getMySurvivorPickForWeek>>;
};

const SurvivorDashboardIcon: FC<SurvivorDashboardIconProps> = ({
  isAlive = false,
  isPlaying,
  lastPick,
  pickForWeek,
}) => {
  if (!isPlaying) {
    return (
      <>
        <div className={cn("mx-auto size-48")}>
          <PiUserDuotone className="h-full w-full" />
        </div>
        <h3 className="position-relative">Observer</h3>
      </>
    );
  }

  if (!isAlive) {
    if (lastPick) {
      return (
        <>
          <Image
            className="grayscale"
            height={206}
            src={`/NFLLogos/${lastPick.TeamLogo}`}
            width={206}
            layout="intrinsic"
            alt={`${lastPick.TeamCity} ${lastPick.TeamName}`}
            title={`${lastPick.TeamCity} ${lastPick.TeamName}`}
          />
          <h3 className="mt-n4 fw-bold text-danger position-relative">You&lsquo;re Out</h3>
        </>
      );
    }

    return (
      <>
        <div className={cn("mx-auto size-48 grayscale relative")}>
          <PiFootballHelmetDuotone className="h-full w-full" />
          <PiQuestionMark className="h-full w-full text-red-600" />
        </div>
        <h3 className="text-bold text-red-600 relative">You&lsquo;re Out</h3>
      </>
    );
  }

  if (!pickForWeek) {
    return (
      <>
        <div className={cn("mx-auto size-48 relative")}>
          <PiFootballHelmetDuotone className="h-full w-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <PiQuestionMark className="h-full w-full text-red-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <h3 className="text-bold text-red-600 relative">No Pick Made</h3>
      </>
    );
  }

  return (
    <>
      <Image
        height={206}
        src={`/NFLLogos/${pickForWeek.TeamLogo}`}
        width={206}
        layout="intrinsic"
        alt={`${pickForWeek.TeamCity} ${pickForWeek.TeamName}`}
        title={`${pickForWeek.TeamCity} ${pickForWeek.TeamName}`}
      />
      <h3 className="mt-n4 fw-bold text-success position-relative">Still Alive</h3>
    </>
  );
};

export default SurvivorDashboardIcon;
