type Payout = {
  UserName: string | null;
  UserPaidOut: number | null;
  UserWon: number | null;
} | null;

export const getWon = (winner: Payout): number => Number(winner?.UserWon ?? 0);

export const getFullName = (winner: Payout): string => winner?.UserName ?? "Missing Name";

export const getRemainingToPay = (winner: Payout): number => getWon(winner) + Number(winner?.UserPaidOut ?? 0);

export const clampPayout = (value: number, max: number): number => Math.min(Math.max(value, 0), max);

export const getPayoutLabel = (fullName: string, remainingToPay: number, won: number): string =>
  remainingToPay > 0 ? `${fullName} is still owed $${remainingToPay} / $${won}` : `${fullName} has been paid $${won}`;
