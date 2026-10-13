import type { User } from "./AdminUserColumns";

export const getRowActionVisibility = (
  user: Pick<User, "UserDoneRegistering" | "UserOwes" | "UserTrusted">,
): { canManageSurvivor: boolean; canTakePayment: boolean; canTrust: boolean } => ({
  canManageSurvivor: user.UserDoneRegistering === 1,
  canTakePayment: (user.UserOwes ?? 0) > 0 || user.UserDoneRegistering === 1,
  canTrust: user.UserTrusted !== 1,
});

// Offered only for registered users with no payment on record, and never for the acting admin themselves.
export const canShowDeregister = (
  user: Pick<User, "UserDoneRegistering" | "UserID" | "UserPaid">,
  currentUserId: number,
): boolean => user.UserDoneRegistering === 1 && user.UserID !== currentUserId && (user.UserPaid ?? 0) === 0;
