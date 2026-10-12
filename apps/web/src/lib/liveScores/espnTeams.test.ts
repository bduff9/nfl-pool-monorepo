import { describe, expect, it } from "vitest";

import { toTeamShortName } from "./espnTeams";

// ESPN abbreviations for all 32 teams mapped to the TeamIdSchema codes in packages/api/src/validation.ts
const EXPECTED: Record<string, string> = {
  ARI: "ARI",
  ATL: "ATL",
  BAL: "BAL",
  BUF: "BUF",
  CAR: "CAR",
  CHI: "CHI",
  CIN: "CIN",
  CLE: "CLE",
  DAL: "DAL",
  DEN: "DEN",
  DET: "DET",
  GB: "GBP",
  HOU: "HOU",
  IND: "IND",
  JAX: "JAC",
  KC: "KCC",
  LAC: "LAC",
  LAR: "LAR",
  LV: "LVR",
  MIA: "MIA",
  MIN: "MIN",
  NE: "NEP",
  NO: "NOS",
  NYG: "NYG",
  NYJ: "NYJ",
  PHI: "PHI",
  PIT: "PIT",
  SEA: "SEA",
  SF: "SFO",
  TB: "TBB",
  TEN: "TEN",
  WSH: "WAS",
};

describe("toTeamShortName", () => {
  it("covers all 32 teams", () => {
    expect(Object.keys(EXPECTED)).toHaveLength(32);

    for (const [espn, ours] of Object.entries(EXPECTED)) {
      expect(toTeamShortName(espn)).toBe(ours);
    }
  });

  it("passes unknown abbreviations through", () => {
    expect(toTeamShortName("XYZ")).toBe("XYZ");
  });
});
