import type { User } from "./AdminUserColumns";

export const getRowActionVisibility = (
  user: Pick<User, "UserDoneRegistering" | "UserOwes" | "UserTrusted">,
): { canManageSurvivor: boolean; canTakePayment: boolean; canTrust: boolean } => ({
  canManageSurvivor: user.UserDoneRegistering === 1,
  canTakePayment: (user.UserOwes ?? 0) > 0 || user.UserDoneRegistering === 1,
  canTrust: user.UserTrusted !== 1,
});

// Offered for anyone still in this season's standings (including users the payment lockout unregistered, who keep
// their picks) with no payment on record, and never for the acting admin themselves.
export const canShowDeregister = (
  user: Pick<User, "UserHasSeasonEntries" | "UserID" | "UserPaid">,
  currentUserId: number,
): boolean => Number(user.UserHasSeasonEntries) === 1 && user.UserID !== currentUserId && (user.UserPaid ?? 0) === 0;
