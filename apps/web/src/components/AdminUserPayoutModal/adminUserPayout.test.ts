import { describe, expect, it } from "vitest";

import { clampPayout, getFullName, getPayoutLabel, getRemainingToPay, getWon } from "./adminUserPayout";

describe("payout summary", () => {
  const winner = { UserName: "Pat", UserPaidOut: -20, UserWon: 50 };

  it("reads values from the winner", () => {
    expect(getFullName(winner)).toBe("Pat");
    expect(getWon(winner)).toBe(50);
    expect(getRemainingToPay(winner)).toBe(30);
  });

  it("falls back when there is no winner", () => {
    expect(getFullName(null)).toBe("Missing Name");
    expect(getWon(null)).toBe(0);
    expect(getRemainingToPay({ UserName: null, UserPaidOut: null, UserWon: null })).toBe(0);
  });
});

describe("clampPayout", () => {
  it("keeps values inside 0..max", () => {
    expect(clampPayout(10, 50)).toBe(10);
    expect(clampPayout(-5, 50)).toBe(0);
    expect(clampPayout(80, 50)).toBe(50);
  });
});

describe("getPayoutLabel", () => {
  it("shows what is still owed", () => {
    expect(getPayoutLabel("Pat", 30, 50)).toBe("Pat is still owed $30 / $50");
  });

  it("shows paid in full", () => {
    expect(getPayoutLabel("Pat", 0, 50)).toBe("Pat has been paid $50");
  });
});
