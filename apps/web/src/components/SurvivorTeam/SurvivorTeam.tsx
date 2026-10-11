"use client";

import { Badge } from "@nfl-pool-monorepo/ui/components/badge";

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
import type { getMySurvivorPicks } from "@/server/loaders/survivor";
import type { getTeamsOnBye } from "@/server/loaders/team";
import "client-only";

import type { FC } from "react";
import { PiFootballDuotone } from "react-icons/pi";

import TeamLogo from "../TeamLogo/TeamLogo";
import {
  getPickBadgeVariant,
  getSurvivorTeamClasses,
  getSurvivorTeamStateClasses,
  isSurvivorTeamDisabled,
  isTeamLoading,
} from "./survivorTeamHelpers";

type Props = {
  isHome?: boolean;
  isOnBye?: boolean;
  loading?: null | number;
  onClick?: () => void;
  pick: Awaited<ReturnType<typeof getMySurvivorPicks>>[number] | undefined;
  team: Awaited<ReturnType<typeof getTeamsOnBye>>[number] | null;
  weekInProgress: number | null;
};

const SurvivorPickBadge: FC<Pick<Props, "pick" | "weekInProgress">> = ({ pick, weekInProgress }) => {
  if (!pick) return null;

  return (
    <Badge
      className="rounded-full absolute top-0 start-0"
      variant={getPickBadgeVariant(pick.SurvivorPickWeek, weekInProgress)}
    >
      {pick.SurvivorPickWeek}
    </Badge>
  );
};

const SurvivorTeamName: FC<Pick<Props, "team">> = ({ team }) => (
  <>
    <span className="hidden md:inline">
      {team?.TeamCity}
      <br />
    </span>
    {team?.TeamName}
  </>
);

const SurvivorTeam: FC<Props> = ({ isHome, isOnBye, loading, onClick, pick, team, weekInProgress }) => {
  const stateClasses = getSurvivorTeamStateClasses(pick?.SurvivorPickWeek, weekInProgress, isOnBye, loading, isHome);

  return (
    <button
      className={getSurvivorTeamClasses(stateClasses, isOnBye)}
      disabled={isSurvivorTeamDisabled(!!onClick, !!pick, loading)}
      onClick={onClick}
      type="button"
    >
      <SurvivorPickBadge pick={pick} weekInProgress={weekInProgress} />
      <TeamLogo team={team} />
      <br />
      {isTeamLoading(loading, team?.TeamID) && <PiFootballDuotone aria-hidden="true" className="animate-spin" />}
      <SurvivorTeamName team={team} />
    </button>
  );
};

export default SurvivorTeam;
