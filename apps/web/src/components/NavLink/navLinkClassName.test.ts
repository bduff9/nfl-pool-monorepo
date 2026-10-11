import { describe, expect, it } from "vitest";

import { getNavLinkClassName } from "./navLinkClassName";

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
