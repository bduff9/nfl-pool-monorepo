import { describe, expect, it } from "vitest";

import { cacheTags } from "./cacheTags";

describe("cacheTags", () => {
  it("builds stable tag names from ids", () => {
    expect(cacheTags.gamesWeek(3)).toBe("games-week-3");
    expect(cacheTags.overallMv()).toBe("overall-mv");
    expect(cacheTags.weeklyMv(4)).toBe("weekly-mv-4");
  });
});
