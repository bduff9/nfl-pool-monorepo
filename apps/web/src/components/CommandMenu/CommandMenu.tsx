import type { User } from "@nfl-pool-monorepo/types";
import type { FC } from "react";

import { getOverallMvCount } from "@/server/loaders/overallMv";
import { getIsAliveInSurvivor } from "@/server/loaders/survivor";
import { getSurvivorOverallCounts } from "@/server/loaders/survivorMv";
import { getMyTiebreaker } from "@/server/loaders/tiebreaker";
import { getCurrentWeekCached, getSelectedWeek, getWeekStatus } from "@/server/loaders/week";
import { getWeeklyMvCount } from "@/server/loaders/weeklyMv";

import { CommandMenuClient } from "./CommandMenu.client";

type Props = {
  user: User;
};

export const CommandMenu: FC<Props> = async ({ user }) => {
  const currentWeek = await getCurrentWeekCached();
  const selectedWeek = await getSelectedWeek(currentWeek);

  const [isAliveInSurvivor, overallMvCount, selectedWeekStatus, survivorMvCounts, myTiebreaker, weeklyMvCount] =
    await Promise.all([
      getIsAliveInSurvivor(),
      getOverallMvCount(),
      getWeekStatus(selectedWeek),
      getSurvivorOverallCounts(),
      getMyTiebreaker(selectedWeek),
      getWeeklyMvCount(selectedWeek),
    ]);

  return (
    <CommandMenuClient
      isAliveInSurvivor={isAliveInSurvivor}
      myTiebreaker={myTiebreaker}
      overallMvCount={overallMvCount}
      selectedWeekStatus={selectedWeekStatus}
      survivorMvCount={survivorMvCounts.overallCount}
      user={user}
      weeklyMvCount={weeklyMvCount}
    />
  );
};
