import { cn } from "@nfl-pool-monorepo/utils/styles";
import type { FC } from "react";

import {
  getMyBestPlacementOverall,
  getMyBestPlacementWeekly,
  type MyBestPlacementOverall,
  type MyBestPlacementWeekly,
} from "@/server/loaders/bestPlacement";
import { getSelectedWeek } from "@/server/loaders/week";

import { ScenarioDashboardTitle } from "./ScenariosDashboard.client";

type Props = {
  scope: "overall" | "weekly";
};

type Scenario = {
  detail: string;
  headline: string;
};

// Engagement panel built on the BestPlacement tables. Per product decision it is
// positive-only: it says what is still achievable and renders nothing at all when
// nothing is in reach — it never tells a user they cannot finish somewhere.
// fallow-ignore-next-line complexity -- positive-only priority ladder: each branch is a distinct marketing message
const getOverallScenario = (overall: MyBestPlacementOverall | null): Scenario | null => {
  if (overall?.canAchieveFirst) {
    return {
      detail: "Every remaining game is a chance to take the top spot.",
      headline: "You can still win the overall pool!",
    };
  }

  if (overall?.canAchieveSecond || overall?.canAchieveThird) {
    const best = overall.canAchieveSecond ? "2nd" : "3rd";

    return {
      detail: "Keep those weekly picks coming.",
      headline: `You're still in the prize hunt — ${best} place is within reach!`,
    };
  }

  return null;
};

// fallow-ignore-next-line complexity -- positive-only priority ladder: each branch is a distinct marketing message
const getWeeklyScenario = (weekly: MyBestPlacementWeekly | null): Scenario | null => {
  if (weekly?.canAchieveFirst) {
    const pointsBack =
      weekly.pointsBack !== null && weekly.pointsBack > 0
        ? `You're ${weekly.pointsBack} point${weekly.pointsBack === 1 ? "" : "s"} back with ${weekly.undecidedGamesAtCalc} game${weekly.undecidedGamesAtCalc === 1 ? "" : "s"} left this week.`
        : "Every remaining game this week can move you up the standings.";

    return { detail: pointsBack, headline: "A weekly win is still in reach!" };
  }

  if (weekly?.canAchieveSecond) {
    return {
      detail: "Every remaining game this week can move you up the standings.",
      headline: "A weekly podium finish is still in reach — 2nd is possible!",
    };
  }

  return null;
};

// fallow-ignore-next-line complexity -- CRAP is estimated without coverage data; exercised via review screenshots on both scopes
const ScenariosDashboard: FC<Props> = async ({ scope }) => {
  const selectedWeek = await getSelectedWeek();
  const overallPromise = scope === "overall" ? getMyBestPlacementOverall() : Promise.resolve(null);
  const weeklyPromise = scope === "weekly" ? getMyBestPlacementWeekly(selectedWeek) : Promise.resolve(null);
  const [overall, weekly] = await Promise.all([overallPromise, weeklyPromise]);

  const scenario = scope === "overall" ? getOverallScenario(overall) : getWeeklyScenario(weekly);

  if (!scenario) {
    return null;
  }

  return (
    <div className={cn("text-center w-full md:w-[35%] px-6 py-2")}>
      <ScenarioDashboardTitle />
      <div className="text-lg text-green-600 font-semibold mt-1">{scenario.headline}</div>
      {scenario.detail ? <div className="text-sm text-muted-foreground mt-2">{scenario.detail}</div> : null}
    </div>
  );
};

export default ScenariosDashboard;
