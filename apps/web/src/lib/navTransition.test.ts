import { describe, expect, it } from "vitest";

import { getNavTransitionTypes, navDepth } from "./navTransition";

describe("navDepth", () => {
  it("treats the dashboard as the root", () => {
    expect(navDepth("/")).toBe(0);
    expect(navDepth("/?week=3")).toBe(0);
  });

  it("treats top-level pages as depth 1", () => {
    expect(navDepth("/weekly")).toBe(1);
    expect(navDepth("/picks/view")).toBe(1);
    expect(navDepth("/admin/users?week=2")).toBe(1);
  });

  it("treats a game page as depth 2", () => {
    expect(navDepth("/scoreboard/game/401")).toBe(2);
    expect(navDepth("/scoreboard/game/401?week=4")).toBe(2);
  });
});

describe("getNavTransitionTypes", () => {
  it("pushes when going deeper", () => {
    expect(getNavTransitionTypes("/", "/weekly?week=3")).toEqual(["nav-forward"]);
    expect(getNavTransitionTypes("/scoreboard", "/scoreboard/game/401?week=3")).toEqual(["nav-forward"]);
  });

  it("pops when going shallower", () => {
    expect(getNavTransitionTypes("/weekly", "/")).toEqual(["nav-back"]);
    expect(getNavTransitionTypes("/scoreboard/game/401", "/scoreboard")).toEqual(["nav-back"]);
  });

  it("fades between same-depth pages", () => {
    expect(getNavTransitionTypes("/weekly", "/overall")).toEqual(["nav-fade"]);
  });

  it("adds nothing when only the query changes", () => {
    expect(getNavTransitionTypes("/weekly", "/weekly?week=4")).toEqual([]);
  });
});
