import type { PayoutStatus } from "@/lib/payoutStatus";

export const PAYOUT_STATUS_CLASS: Record<PayoutStatus, string> = {
  paid: "text-green-600 line-through",
  partial: "text-amber-600",
  unpaid: "text-red-600",
};

export const getPayoutTitle = (won: number | null, balance: number | null): string =>
  `Paid out $${(won ?? 0) - (balance ?? 0)} / $${won}`;
