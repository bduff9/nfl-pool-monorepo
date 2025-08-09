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
import { redirect } from "next/navigation";

import CustomHead from "@/components/CustomHead/CustomHead";
import type { NP } from "@/lib/types";
import { quickPick } from "@/server/actions/pick";

const QuickPickPage: NP = async ({ params }) => {
  const { userId, teamId } = await params;
  const [data, error] = await quickPick({ teamId: teamId as unknown as number, userId: userId as unknown as number });

  if (data) {
    return redirect("/picks/set");
  }

  return (
    <div className="min-h-screen">
      <CustomHead title="Quick Pick" />
      <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2">
        <h2 className={cn("scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0")}>
          Quick pick failed!
        </h2>
        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">{error.message}</h3>
      </div>
    </div>
  );
};

export default QuickPickPage;
