"use server";

import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
    await deleteSessionTokenCookie();
    revalidatePath("/", "layout");
  }

  redirect("/auth/login");
};
