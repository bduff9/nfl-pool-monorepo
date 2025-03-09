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
