"use server";

import { db } from "@nfl-pool-monorepo/db/src/kysely";
import "server-only";

import { deleteSessionTokenCookie, invalidateSession } from "@/lib/auth";

import { getCurrentSession } from "../loaders/sessions";
import { writeLog } from "./logs";

// Returns instead of redirecting: a Server Action redirect can't carry a transition type, so the caller navigates to
// the login page itself, with the nav-fade transition.
export const signOut = async (): Promise<{ signedOut: true }> => {
  const { session, user } = await getCurrentSession();

  if (user) {
    const userObj = await db
      .selectFrom("Users")
      .select(["UserName"])
      .where("UserID", "=", user.id)
      .executeTakeFirstOrThrow();

    try {
      await writeLog({
        LogAction: "LOGOUT",
        LogData: null,
        LogMessage: `${userObj.UserName} signed out`,
      });
    } catch (error) {
      console.error("Failed to write logout audit log", { error, userId: user.id });
    }

    await invalidateSession(session.id);
    // Deleting the cookie already makes the client drop its whole router cache. No server-cached data depends on
    // who is signed in, so nothing is revalidated: a layout-wide revalidatePath also expired the service worker route.
    await deleteSessionTokenCookie();
  }

  return { signedOut: true };
};
