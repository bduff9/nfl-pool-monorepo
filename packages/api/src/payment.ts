import { signOutUserFromAllDevices } from "@nfl-pool-monorepo/db/src/mutations/session";
import { unregisterUser } from "@nfl-pool-monorepo/db/src/mutations/users";
import { getUsersWhoOwe } from "@nfl-pool-monorepo/db/src/queries/payment";
import { getPaymentDueWeek } from "@nfl-pool-monorepo/db/src/queries/systemValue";
import { sendLockedOutEmail } from "@nfl-pool-monorepo/transactional/emails/lockedOut";

export const lockLatePaymentUsers = async (week: number): Promise<void> => {
  const dueWeek = await getPaymentDueWeek();

  if (week < dueWeek) {
    return;
  }

  const payments = await getUsersWhoOwe();

  for (const payment of payments) {
    try {
      await unregisterUser(payment.UserID);
      await signOutUserFromAllDevices(payment.UserID);
      await sendLockedOutEmail(payment.UserID, Math.abs(payment.balance), week);
    } catch (error) {
      console.error("Failed to lock out late-payment user, continuing with remaining users", { error, payment });
    }
  }
};
