import dns from "node:dns";

import { db } from "@nfl-pool-monorepo/db/src/kysely";
import type { User } from "@nfl-pool-monorepo/types";
import { hash, verify } from "@node-rs/argon2";
import { sha1 } from "@oslojs/crypto/sha1";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { Google } from "arctic";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import "server-only";

import { getCurrentSession } from "@/server/loaders/sessions";

export type SessionValidationResult = { session: Session; user: User } | { session: null; user: null };

export type Session = {
  id: string;
  userId: number;
  expiresAt: Date;
};

/**
 * Default is 30 days
 */
export const DEFAULT_SESSION_LENGTH = 1000 * 60 * 60 * 24 * 30;

export const generateSessionToken = (): string => {
  const bytes = new Uint8Array(20);

  crypto.getRandomValues(bytes);

  return encodeBase32LowerCaseNoPadding(bytes);
};

export const createSession = async (token: string, userId: number): Promise<Session> => {
  const sessionToken = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const session: Session = {
    expiresAt: new Date(Date.now() + DEFAULT_SESSION_LENGTH),
    id: sessionToken,
    userId,
  };

  await db
    .insertInto("Sessions")
    .values({
      SessionAccessToken: "",
      SessionAddedBy: "LUCIA",
      SessionExpires: session.expiresAt,
      SessionToken: sessionToken,
      SessionUpdatedBy: "LUCIA",
      UserID: userId,
    })
    .executeTakeFirstOrThrow();

  return session;
};

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
  const sessionToken = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
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

export const invalidateSession = async (sessionToken: string): Promise<void> => {
  await db.deleteFrom("Sessions").where("SessionToken", "=", sessionToken).executeTakeFirstOrThrow();
};

export const invalidateAllSessions = async (userId: number): Promise<void> => {
  await db.deleteFrom("Sessions").where("UserID", "=", userId).executeTakeFirstOrThrow();
};

export const setSessionTokenCookie = async (token: string, expiresAt: Date): Promise<void> => {
  const cookieStore = await cookies();

  cookieStore.set("session", token, {
    expires: expiresAt,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
};

export const deleteSessionTokenCookie = async (): Promise<void> => {
  const cookieStore = await cookies();

  cookieStore.set("session", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
};

export const hashPassword = (password: string): Promise<string> =>
  hash(password, {
    memoryCost: 19456,
    outputLen: 32,
    parallelism: 1,
    timeCost: 2,
  });

export const verifyPasswordHash = async (hash: string, password: string): Promise<boolean> => verify(hash, password);

export const verifyPasswordStrength = async (password: string): Promise<boolean> => {
  if (password.length < 8 || password.length > 255) {
    return false;
  }

  const hash = encodeHexLowerCase(sha1(new TextEncoder().encode(password)));
  const hashPrefix = hash.slice(0, 5);
  const response = await fetch(`https://api.pwnedpasswords.com/range/${hashPrefix}`);
  const data = await response.text();
  const items = data.split("\n");
  for (const item of items) {
    const hashSuffix = item.slice(0, 35).toLowerCase();

    if (hash === hashPrefix + hashSuffix) {
      return false;
    }
  }

  return true;
};

export const mxExists = async (email: string): Promise<boolean> => {
  try {
    const hostName = email.split("@")[1];
    const addresses = await dns.promises.resolveMx(hostName ?? "");

    return addresses?.every((address) => address.exchange);
  } catch (error) {
    console.error({ error, text: "mx check error:" });

    return false;
  }
};

export const requireAdmin = async (): Promise<string | null> => {
  const { user } = await getCurrentSession();

  if (!user) {
    return "/auth/login";
  }

  if (!user.isAdmin) {
    return redirect("/");
  }

  return null;
};

export const requireLoggedIn = async (): Promise<string | null> => {
  const { user } = await getCurrentSession();

  if (!user) {
    return "/auth/login";
  }

  return null;
};

export const requireLoggedOut = async (): Promise<string | null> => {
  const { user } = await getCurrentSession();

  if (user) {
    return "/auth/login";
  }

  return null;
};

export const requireRegistered = async (): Promise<string | null> => {
  const { user } = await getCurrentSession();

  if (!user) {
    return "/auth/login";
  }

  if (!user.doneRegistering) {
    return "/users/create";
  }

  return null;
};

export const google = new Google(
  env.GOOGLE_ID ?? "",
  env.GOOGLE_SECRET ?? "",
  `${env.NEXT_PUBLIC_SITE_URL}/login/google/callback`,
);
