import type { User } from "@nfl-pool-monorepo/types";
import { cookies } from "next/headers";
import { cache } from "react";

import { type SessionValidationResult, validateSessionToken } from "../../lib/auth";

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
