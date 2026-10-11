import { describe, expect, it } from "vitest";

import {
  getPickBadgeVariant,
  getSurvivorTeamClasses,
  getSurvivorTeamStateClasses,
  isSurvivorTeamDisabled,
  isTeamLoading,
} from "./survivorTeamHelpers";

describe("getPickBadgeVariant", () => {
  it("maps past, current and future picks", () => {
    expect(getPickBadgeVariant(2, 5)).toBe("success");
    expect(getPickBadgeVariant(5, 5)).toBe("blue");
    expect(getPickBadgeVariant(6, 5)).toBe("warning");
  });

  it("treats a missing week in progress as week zero", () => {
    expect(getPickBadgeVariant(1, null)).toBe("warning");
    expect(getPickBadgeVariant(0, null)).toBe("blue");
  });
});

describe("getSurvivorTeamStateClasses", () => {
  it("colors picks by stage", () => {
    expect(getSurvivorTeamStateClasses(2, 5, false, null, false)).toContain("bg-green-200");
    expect(getSurvivorTeamStateClasses(5, 5, false, null, false)).toContain("bg-blue-200");
    expect(getSurvivorTeamStateClasses(6, 5, false, null, false)).toContain("bg-yellow-200");
  });

  it("styles teams on bye", () => {
    expect(getSurvivorTeamStateClasses(undefined, 5, true, null, false)).toBe("border border-border bg-muted");
  });

  it("styles open teams, including loading and home variants", () => {
    const idle = getSurvivorTeamStateClasses(undefined, 5, false, null, false);
    const loading = getSurvivorTeamStateClasses(undefined, 5, false, 3, true);

    expect(idle).toContain("cursor-pointer");
    expect(idle).toContain("border-s");
    expect(loading).toContain("grayscale");
    expect(loading).not.toContain("cursor-pointer");
    expect(loading).not.toContain("border-s");
  });
});

describe("getSurvivorTeamClasses", () => {
  it("sizes bye teams narrower", () => {
    expect(getSurvivorTeamClasses("x", true)).toContain("w-1/2 md:w-1/4 lg:w-1/6");
    expect(getSurvivorTeamClasses("x", false)).toMatch(/w-1\/2$/);
  });
});

describe("isSurvivorTeamDisabled", () => {
  it("disables without a click handler, with a pick, or while loading", () => {
    expect(isSurvivorTeamDisabled(false, false, null)).toBe(true);
    expect(isSurvivorTeamDisabled(true, true, null)).toBe(true);
    expect(isSurvivorTeamDisabled(true, false, 4)).toBe(true);
    expect(isSurvivorTeamDisabled(true, false, null)).toBe(false);
  });
});

describe("isTeamLoading", () => {
  it("matches the loading team id", () => {
    expect(isTeamLoading(4, 4)).toBe(true);
    expect(isTeamLoading(4, 5)).toBe(false);
    expect(isTeamLoading(null, 5)).toBe(false);
  });
});
