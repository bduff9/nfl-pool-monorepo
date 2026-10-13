import { describe, expect, it } from "vitest";

import { getNavLinkClassName, isNavLinkActive } from "./navLinkClassName";

describe("getNavLinkClassName", () => {
  it("uses top-level padding when not nested or active", () => {
    expect(getNavLinkClassName("base", false, false)).toBe("base ps-4");
  });

  it("adds nested typography", () => {
    expect(getNavLinkClassName("base", false, true)).toBe("base ps-8 text-lg font-normal");
  });

  it("adds the active highlight", () => {
    expect(getNavLinkClassName("base", true, false)).toBe("base text-green-700 bg-muted ps-4");
  });
});

describe("isNavLinkActive", () => {
  it("matches only the exact page by default", () => {
    expect(isNavLinkActive("/scoreboard", "/scoreboard", false)).toBe(true);
    expect(isNavLinkActive("/scoreboard/game/401872994", "/scoreboard", false)).toBe(false);
  });

  it("also matches pages under the link when asked, but not look-alike paths", () => {
    expect(isNavLinkActive("/scoreboard/game/401872994", "/scoreboard", true)).toBe(true);
    expect(isNavLinkActive("/scoreboards", "/scoreboard", true)).toBe(false);
  });

  it("is never active without an href", () => {
    expect(isNavLinkActive("/", undefined, true)).toBe(false);
  });
});
