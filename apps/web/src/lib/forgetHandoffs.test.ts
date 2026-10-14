import { describe, expect, it } from "vitest";

import { getAlertsSnapshot, rememberAlerts } from "@/components/CustomHead/alertsHandoff";
import type { ScoreboardGame } from "@/components/ScoreboardGameCard/ScoreboardGameCard";
import { getScoreboardGamesSnapshot, rememberScoreboardGames } from "@/components/ScoreboardGameCard/scoreboardHandoff";

import { forgetHandoffs } from "./forgetHandoffs";
import { headingHandoff } from "./sharedElementHandoff";

describe("forgetHandoffs", () => {
  it("empties every client handoff store", () => {
    headingHandoff.remember("weeklyRankTitle", "1", "Week 1 Rank");
    rememberAlerts(["Please pay $45"]);
    rememberScoreboardGames([{ GameWeek: 1 } as unknown as ScoreboardGame]);

    forgetHandoffs();

    expect(headingHandoff.find("weeklyRankTitle", "1")).toBeUndefined();
    expect(getAlertsSnapshot()).toEqual([]);
    expect(getScoreboardGamesSnapshot()).toBeUndefined();
  });
});
