import type { User } from "@nfl-pool-monorepo/types";
import { describe, expect, it } from "vitest";

import { getAppBadgeCount } from "./navVisibility";

const user = {
  doneRegistering: 1,
  email: "a@b.c",
  id: 1,
  image: null,
  isAdmin: 0,
  name: "A",
  playsSurvivor: 1,
} as User;

describe("getAppBadgeCount", () => {
  it("counts unsubmitted picks and a pending survivor pick", () => {
    expect(getAppBadgeCount(user, 0, true, "Not Started")).toBe(2);
  });

  it("does not count picks that were already submitted", () => {
    expect(getAppBadgeCount(user, 1, true, "Not Started")).toBe(1);
  });

  it("does not count survivor when the user is out or the week has started", () => {
    expect(getAppBadgeCount(user, 1, false, "Not Started")).toBe(0);
    expect(getAppBadgeCount(user, 1, true, "In Progress")).toBe(0);
  });

  it("does not count survivor for users who are not playing it", () => {
    expect(getAppBadgeCount({ ...user, playsSurvivor: 0 }, 1, true, "Not Started")).toBe(0);
  });
});
