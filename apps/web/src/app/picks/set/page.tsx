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

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import "server-only";

import CustomHead from "@/components/CustomHead/CustomHead";
import MakePicksClient from "@/components/MakePicksClient/MakePicksClient";
import PageContent from "@/components/PageContent/PageContent";
import { requireRegistered } from "@/lib/auth";
import { getMyWeeklyPicks } from "@/server/loaders/pick";
import { getMyTiebreaker } from "@/server/loaders/tiebreaker";
import { getSelectedWeek } from "@/server/loaders/week";
import "server-only";

import type { FC } from "react";

const TITLE = "Make Weekly Picks";

export const metadata: Metadata = {
  title: TITLE,
};

const MakePicks: FC<PageProps<"/picks/set">> = async () => {
  const redirectUrl = await requireRegistered();

  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  const selectedWeek = await getSelectedWeek();
  const tiebreakerPromise = getMyTiebreaker(selectedWeek);
  const myWeeklyPicksPromise = getMyWeeklyPicks(selectedWeek);

  const [tiebreaker, myWeeklyPicks] = await Promise.all([tiebreakerPromise, myWeeklyPicksPromise]);

  if (!tiebreaker) {
    return redirect("/");
  }

  if (tiebreaker?.TiebreakerHasSubmitted === 1) {
    return redirect("/picks/view");
  }

  return (
    <div className="h-full flex flex-wrap md:mx-3">
      <CustomHead title={`Make week ${selectedWeek} picks`} />
      <PageContent className="pt-3 pb-[70px]">
        <MakePicksClient selectedWeek={selectedWeek} tiebreaker={tiebreaker} weeklyPicks={myWeeklyPicks} />
      </PageContent>
    </div>
  );
};

export default MakePicks;
