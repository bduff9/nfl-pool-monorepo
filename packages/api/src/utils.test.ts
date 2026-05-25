import { describe, expect, it } from "vitest";

import { getGameStatusFromAPI } from "./utils";

describe("getGameStatusFromAPI", () => {
  it("maps API statuses to database game statuses", () => {
    expect(getGameStatusFromAPI({ status: "SCHED" })).toBe("Pregame");
    expect(getGameStatusFromAPI({ status: "FINAL" })).toBe("Final");
    expect(getGameStatusFromAPI({ quarter: "2nd Quarter", status: "INPROG" })).toBe("2nd Quarter");
    expect(getGameStatusFromAPI({ status: "INPROG" })).toBe("Invalid");
  });
});
