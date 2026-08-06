export type PayoutStatus = "paid" | "partial" | "unpaid";

export const getPayoutStatus = (balance: number, won: number): PayoutStatus => {
  if (balance === won) {
    return "unpaid";
  }

  if (balance === 0) {
    return "paid";
  }

  return "partial";
};
