"use server";
import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { revalidatePath } from "next/cache";
import "server-only";

import { deleteSessionTokenCookie, invalidateSession } from "@/lib/auth";
import { getCurrentSession } from "../loaders/sessions";
import { writeLog } from "./logs";

export const signOut = async (): Promise<void> => {
  const { session, user } = await getCurrentSession();

  if (!user) {
    return;
  }

  const userObj = await db
    .selectFrom("Users")
    .select(["UserName"])
    .where("UserID", "=", user.id)
    .executeTakeFirstOrThrow();

  await writeLog({
    LogAction: "LOGOUT",
    LogData: null,
    LogMessage: `${userObj.UserName} signed out`,
  });
  await invalidateSession(session.id);
  await deleteSessionTokenCookie();
  revalidatePath("/", "layout");
};
