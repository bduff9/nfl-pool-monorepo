import { cn } from "@nfl-pool-monorepo/utils/styles";
import { describe, expect, it } from "vitest";

import { getPayoutStatus } from "@/lib/payoutStatus";

import { getPayoutTitle, PAYOUT_STATUS_CLASS } from "./payoutCellFormat";

// Characterization of the original inline class logic
const legacyClass = (balance: number, won: number): string => {
  const payoutStatus = getPayoutStatus(balance, won);

  return cn(
    "text-right font-bold",
    payoutStatus === "unpaid" && "text-red-600",
    payoutStatus === "paid" && "text-green-600 line-through",
    payoutStatus === "partial" && "text-amber-600",
  );
};

describe("PAYOUT_STATUS_CLASS", () => {
  it.each([
    [50, 50],
    [0, 50],
    [20, 50],
  ])("matches the original classes for balance %i / won %i", (balance, won) => {
    expect(cn("text-right font-bold", PAYOUT_STATUS_CLASS[getPayoutStatus(balance, won)])).toBe(
      legacyClass(balance, won),
    );
  });
});

describe("getPayoutTitle", () => {
  it("formats paid out and total", () => {
    expect(getPayoutTitle(50, 20)).toBe("Paid out $30 / $50");
  });

  it("treats a null balance as zero", () => {
    expect(getPayoutTitle(50, null)).toBe("Paid out $50 / $50");
  });

  it("keeps the raw null in the total like the original", () => {
    expect(getPayoutTitle(null, null)).toBe("Paid out $0 / $null");
  });
});
