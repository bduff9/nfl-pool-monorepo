"use server";

import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { RedirectType, redirect } from "next/navigation";
import "server-only";

import { deleteSessionTokenCookie, invalidateSession } from "@/lib/auth";

import { getCurrentSession } from "../loaders/sessions";
import { writeLog } from "./logs";

export const signOut = async (): Promise<void> => {
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

  // The redirect rides on the same response that deletes the cookie, so no later request can carry the old one back
  // (the proxy re-sets whatever session cookie a request sends). Replace, so Back doesn't return to /auth/logout.
  redirect("/auth/login", RedirectType.replace);
};
