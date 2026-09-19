import { createHash } from "node:crypto";

import { db } from "@nfl-pool-monorepo/db/src/kysely";
import type { User } from "@nfl-pool-monorepo/types";
import { cookies } from "next/headers";
import { cache } from "react";

export type Session = {
  id: string;
  userId: number;
  expiresAt: Date;
};

type SessionValidationResult = { session: Session; user: User } | { session: null; user: null };

/**
 * Default is 30 days
 */
export const DEFAULT_SESSION_LENGTH = 1000 * 60 * 60 * 24 * 30;

async function validateSessionToken(token: string): Promise<SessionValidationResult> {
  const sessionToken = createHash("sha256").update(token).digest("hex");
  const session = await db
    .selectFrom("Sessions")
    .select(["SessionToken", "UserID", "SessionExpires"])
    .where("SessionToken", "=", sessionToken)
    .executeTakeFirst();

  if (!session) {
    return { session: null, user: null };
  }

  const sessionObj: Session = {
    expiresAt: session.SessionExpires,
    id: session.SessionToken,
    userId: session.UserID,
  };

  if (Date.now() >= sessionObj.expiresAt.getTime()) {
    await db.deleteFrom("Sessions").where("SessionToken", "=", session.SessionToken).executeTakeFirstOrThrow();

    return { session: null, user: null };
  }

  const user = await db
    .selectFrom("Users")
    .select([
      "UserID as id",
      "UserDoneRegistering as doneRegistering",
      "UserIsAdmin as isAdmin",
      "UserPlaysSurvivor as playsSurvivor",
      "UserEmail as email",
      "UserName as name",
      "UserImage as image",
    ])
    .where("UserID", "=", session.UserID)
    .executeTakeFirstOrThrow();

  if (Date.now() >= sessionObj.expiresAt.getTime() - DEFAULT_SESSION_LENGTH / 2) {
    sessionObj.expiresAt = new Date(Date.now() + DEFAULT_SESSION_LENGTH);

    await db
      .updateTable("Sessions")
      .set({ SessionExpires: sessionObj.expiresAt })
      .where("SessionToken", "=", sessionObj.id)
      .executeTakeFirstOrThrow();
  }

  return { session: sessionObj, user };
}

export const getCurrentSession = cache(async (): Promise<SessionValidationResult> => {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value ?? null;

  if (!token) {
    return { session: null, user: null };
  }

  return validateSessionToken(token);
});

export const requireUser = async (): Promise<User> => {
  const { user } = await getCurrentSession();

  if (!user) {
    throw new Error("Not logged in");
  }

  return user;
};
