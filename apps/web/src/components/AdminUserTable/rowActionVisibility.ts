import type { User } from "./AdminUserColumns";

export const getRowActionVisibility = (
  user: Pick<User, "UserDoneRegistering" | "UserOwes" | "UserTrusted">,
): { canManageSurvivor: boolean; canTakePayment: boolean; canTrust: boolean } => ({
  canManageSurvivor: user.UserDoneRegistering === 1,
  canTakePayment: (user.UserOwes ?? 0) > 0 || user.UserDoneRegistering === 1,
  canTrust: user.UserTrusted !== 1,
});
