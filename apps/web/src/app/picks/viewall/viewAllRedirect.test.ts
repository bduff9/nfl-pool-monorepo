import { describe, expect, it } from "vitest";

import { getViewAllRedirect } from "./viewAllRedirect";

describe("getViewAllRedirect", () => {
  it("sends users who have not submitted to the picks page", () => {
    expect(getViewAllRedirect(false, 5, 3)).toBe("/picks/set?week=3");
  });

  it("checks submission before rankings", () => {
    expect(getViewAllRedirect(false, 0, 3)).toBe("/picks/set?week=3");
  });

  it("sends submitted users without rankings to the view page", () => {
    expect(getViewAllRedirect(true, 0, 3)).toBe("/picks/view?week=3");
  });

  it("does not redirect when submitted with rankings", () => {
    expect(getViewAllRedirect(true, 2, 3)).toBeNull();
  });
});
