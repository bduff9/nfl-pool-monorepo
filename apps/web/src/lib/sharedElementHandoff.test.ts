import { describe, expect, it } from "vitest";

import {
  forgetSharedElementHandoffs,
  headingHandoff,
  progressChartHandoff,
  rankingPieChartHandoff,
  survivorDashboardIconHandoff,
} from "./sharedElementHandoff";

const bar = (max: number) => ({ correct: 1, incorrect: 2, isOver: false, max, type: "Points" as const });

describe("shared element handoffs", () => {
  it("hand back what was remembered under a name for the same week", () => {
    const value = bar(136);

    progressChartHandoff.remember("weeklyPointsEarned", "1", value);

    expect(progressChartHandoff.find("weeklyPointsEarned", "1")).toBe(value);
  });

  it("hand nothing to another week, or to a URL with or without a week when the other had the opposite", () => {
    headingHandoff.remember("weeklyRankTitle", "1", "Week 1 Rank");
    headingHandoff.remember("overallRankTitle", null, "Overall Rank");

    expect(headingHandoff.find("weeklyRankTitle", "2")).toBeUndefined();
    expect(headingHandoff.find("weeklyRankTitle", null)).toBeUndefined();
    expect(headingHandoff.find("overallRankTitle", "1")).toBeUndefined();
    expect(headingHandoff.find("overallRankTitle", null)).toBe("Overall Rank");
  });

  it("keep handing out the same value when an equal one is remembered again", () => {
    const first = bar(16);

    progressChartHandoff.remember("weeklyGamesCorrect", "1", first);
    progressChartHandoff.remember("weeklyGamesCorrect", "1", bar(16));

    expect(progressChartHandoff.find("weeklyGamesCorrect", "1")).toBe(first);

    progressChartHandoff.remember("weeklyGamesCorrect", "1", bar(17));

    expect(progressChartHandoff.find("weeklyGamesCorrect", "1")).toEqual(bar(17));
  });

  it("hand nothing for a name no page rendered", () => {
    expect(headingHandoff.find("myOverallResultsTitle", "1")).toBeUndefined();
  });

  it("keep only the latest value per name", () => {
    progressChartHandoff.remember("survivorWeekStatus", "1", bar(3));
    progressChartHandoff.remember("survivorWeekStatus", "2", bar(4));

    expect(progressChartHandoff.find("survivorWeekStatus", "1")).toBeUndefined();
    expect(progressChartHandoff.find("survivorWeekStatus", "2")).toEqual(bar(4));
  });

  it("keep separate kinds of element apart", () => {
    headingHandoff.remember("weeklyRankingPieChart", "1", "not a pie");

    expect(rankingPieChartHandoff.find("weeklyRankingPieChart", "1")).toBeUndefined();
  });

  it("forget everything on sign out, so the next user's skeletons never show this user's data", () => {
    headingHandoff.remember("weeklyRankTitle", "1", "Week 1 Rank");
    progressChartHandoff.remember("weeklyPointsEarned", "1", bar(136));
    rankingPieChartHandoff.remember("weeklyRankingPieChart", "1", []);
    survivorDashboardIconHandoff.remember("survivorIcon", "1", {} as never);

    forgetSharedElementHandoffs();

    expect(headingHandoff.find("weeklyRankTitle", "1")).toBeUndefined();
    expect(progressChartHandoff.find("weeklyPointsEarned", "1")).toBeUndefined();
    expect(rankingPieChartHandoff.find("weeklyRankingPieChart", "1")).toBeUndefined();
    expect(survivorDashboardIconHandoff.find("survivorIcon", "1")).toBeUndefined();
  });
});
