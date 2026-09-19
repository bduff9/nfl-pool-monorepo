import { createHash } from "node:crypto";
import dns from "node:dns";

import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { hash, verify } from "@node-rs/argon2";
import { encodeBase32LowerCaseNoPadding } from "@oslojs/encoding";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import { GoogleOAuthClient } from "@/lib/googleOAuth";
import "server-only";

import type { Route } from "next";

import { DEFAULT_SESSION_LENGTH, getCurrentSession, type Session } from "@/server/loaders/sessions";

/**
 * Ensures a post-login redirect target is a relative path, not an external or protocol-relative URL.
 */
export const sanitizeRedirectPath = (raw: string | null | undefined, fallback: string): string => {
  const rawRedirect = raw ?? "";

  return rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : fallback;
};

export const generateSessionToken = (): string => {
  const bytes = new Uint8Array(20);

  crypto.getRandomValues(bytes);

  return encodeBase32LowerCaseNoPadding(bytes);
};

export const createSession = async (token: string, userId: number): Promise<Session> => {
  const sessionToken = createHash("sha256").update(token).digest("hex");
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

export const invalidateSession = async (sessionToken: string): Promise<void> => {
  await db.deleteFrom("Sessions").where("SessionToken", "=", sessionToken).executeTakeFirstOrThrow();
};

export const invalidateAllSessions = async (userId: number): Promise<void> => {
  await db.deleteFrom("Sessions").where("UserID", "=", userId).execute();
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

  const hash = createHash("sha1").update(password).digest("hex");
  const hashPrefix = hash.slice(0, 5);

  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${hashPrefix}`);

    if (!response.ok) {
      throw new Error(`Have I Been Pwned API returned ${response.status}`);
    }

    const data = await response.text();
    const items = data.split("\n");

    for (const item of items) {
      const hashSuffix = item.slice(0, 35).toLowerCase();

      if (hash === hashPrefix + hashSuffix) {
        return false;
      }
    }
  } catch (error) {
    console.error("Failed to check password strength against Have I Been Pwned, allowing password", error);
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

export const requireAdmin = async (): Promise<Route | null> => {
  const { user } = await getCurrentSession();

  if (!user) {
    return "/auth/login";
  }

  if (!user.isAdmin) {
    return redirect("/");
  }

  return null;
};

export const requireLoggedIn = async (): Promise<Route | null> => {
  const { user } = await getCurrentSession();

  if (!user) {
    return "/auth/login";
  }

  return null;
};

export const requireLoggedOut = async (): Promise<Route | null> => {
  const { user } = await getCurrentSession();

  if (!user) {
    return null;
  }

  if (!user.doneRegistering) {
    return "/users/create";
  }

  return "/";
};

export const requireRegistered = async (): Promise<Route | null> => {
  const { user } = await getCurrentSession();

  if (!user) {
    return "/auth/login";
  }

  if (!user.doneRegistering) {
    return "/users/create";
  }

  return null;
};

export const google = new GoogleOAuthClient(
  env.GOOGLE_ID ?? "",
  env.GOOGLE_SECRET ?? "",
  `${env.NEXT_PUBLIC_SITE_URL}/login/google/callback`,
);
