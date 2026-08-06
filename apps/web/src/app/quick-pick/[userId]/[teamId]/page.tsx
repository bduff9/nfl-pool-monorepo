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

import { getTeamById } from "@nfl-pool-monorepo/db/src/queries/team";
import "server-only";

import type { FC, ReactNode } from "react";

import CustomHead from "@/components/CustomHead/CustomHead";
import QuickPickConfirm from "@/components/QuickPickConfirm/QuickPickConfirm";

const QuickPickCard: FC<{ children: ReactNode; title: string }> = ({ children, title }) => (
  <div className="min-h-screen flex flex-col md:mx-3">
    <CustomHead title="Quick Pick" />
    <div className="bg-gray-100 text-gray-800 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-gray-800 rounded-lg p-4 shrink-0 grow w-full h-full lg:h-auto lg:w-[50%] xl:w-[33%] text-center">
      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">{title}</h2>
      {children}
    </div>
  </div>
);

const QuickPickPage: FC<PageProps<"/quick-pick/[userId]/[teamId]">> = async ({ params }) => {
  const { userId, teamId } = await params;
  const team = await getTeamById(Number(teamId));

  if (!team) {
    return (
      <QuickPickCard title="Quick pick failed!">
        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Team not found</h3>
      </QuickPickCard>
    );
  }

  return (
    <QuickPickCard title="Confirm Quick Pick">
      <QuickPickConfirm
        teamId={Number(teamId)}
        teamLabel={`${team.TeamCity} ${team.TeamName}`}
        userId={Number(userId)}
      />
    </QuickPickCard>
  );
};

export default QuickPickPage;
