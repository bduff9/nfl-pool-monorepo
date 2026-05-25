import { describe, expect, it } from "vitest";

import { getGameStatusFromAPI, parseTeamsFromApi } from "./utils";
import type { ApiMatchup, ApiTeam } from "./validation";

describe("getGameStatusFromAPI", () => {
  it("returns 'Pregame' for SCHED status", () => {
    expect(getGameStatusFromAPI({ status: "SCHED" })).toBe("Pregame");
  });

  it("returns 'Final' for FINAL status", () => {
    expect(getGameStatusFromAPI({ status: "FINAL" })).toBe("Final");
  });

  it("returns the quarter string for INPROG with quarter set", () => {
    expect(getGameStatusFromAPI({ quarter: "1st Quarter", status: "INPROG" })).toBe("1st Quarter");
    expect(getGameStatusFromAPI({ quarter: "2nd Quarter", status: "INPROG" })).toBe("2nd Quarter");
    expect(getGameStatusFromAPI({ quarter: "Half Time", status: "INPROG" })).toBe("Half Time");
    expect(getGameStatusFromAPI({ quarter: "3rd Quarter", status: "INPROG" })).toBe("3rd Quarter");
    expect(getGameStatusFromAPI({ quarter: "4th Quarter", status: "INPROG" })).toBe("4th Quarter");
    expect(getGameStatusFromAPI({ quarter: "Overtime", status: "INPROG" })).toBe("Overtime");
  });

  it("returns 'Invalid' for INPROG without a quarter", () => {
    expect(getGameStatusFromAPI({ status: "INPROG" })).toBe("Invalid");
  });

  it("returns 'Pregame' for SCHED regardless of quarter", () => {
    expect(getGameStatusFromAPI({ quarter: "2nd Quarter", status: "SCHED" })).toBe("Pregame");
  });

  it("returns 'Final' for FINAL regardless of quarter", () => {
    expect(getGameStatusFromAPI({ quarter: "4th Quarter", status: "FINAL" })).toBe("Final");
  });

  it("returns the quarter value when status is missing but quarter exists", () => {
    expect(getGameStatusFromAPI({ quarter: "3rd Quarter" } as Pick<ApiMatchup, "quarter" | "status">)).toBe(
      "3rd Quarter",
    );
  });
});

describe("parseTeamsFromApi", () => {
  const makeTeam = (isHome: "0" | "1", id: string): ApiTeam =>
    ({
      hasPossession: "0",
      id,
      inRedZone: "0",
      isHome,
      passDefenseRank: 1,
      passOffenseRank: 1,
      rushDefenseRank: 1,
      rushOffenseRank: 1,
      score: 0,
      spread: 0,
    }) as unknown as ApiTeam;

  it("returns [home, visitor] from a two-team array", () => {
    const visitor = makeTeam("0", "NYG");
    const home = makeTeam("1", "DAL");
    const [h, v] = parseTeamsFromApi([visitor, home]);
    expect(h.id).toBe("DAL");
    expect(v.id).toBe("NYG");
  });

  it("works regardless of array order", () => {
    const home = makeTeam("1", "PHI");
    const visitor = makeTeam("0", "WAS");
    const [h, v] = parseTeamsFromApi([home, visitor]);
    expect(h.id).toBe("PHI");
    expect(v.id).toBe("WAS");
  });

  it("throws when no home team is present", () => {
    const visitor1 = makeTeam("0", "NYG");
    const visitor2 = makeTeam("0", "DAL");
    expect(() => parseTeamsFromApi([visitor1, visitor2])).toThrow();
  });

  it("throws when no visitor team is present", () => {
    const home1 = makeTeam("1", "NYG");
    const home2 = makeTeam("1", "DAL");
    expect(() => parseTeamsFromApi([home1, home2])).toThrow();
  });

  it("throws for an empty array", () => {
    expect(() => parseTeamsFromApi([])).toThrow();
  });
});
