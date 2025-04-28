import { db } from "@nfl-pool-monorepo/db/src/kysely";
import type { OAuth2Tokens } from "arctic";
import { decodeIdToken } from "arctic";
import { cookies } from "next/headers";

import { createSession, generateSessionToken, google, setSessionTokenCookie } from "@/lib/auth";
import { getCurrentSession } from "@/server/loaders/sessions";

type GoogleClaims = {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  at_hash: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  iat: number;
  exp: number;
};

export const GET = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const storedState = cookieStore.get("google_oauth_state")?.value ?? null;
  const codeVerifier = cookieStore.get("google_code_verifier")?.value ?? null;

  if (code === null || state === null || storedState === null || codeVerifier === null) {
    return new Response(null, {
      status: 400,
    });
  }

  if (state !== storedState) {
    return new Response(null, {
      status: 400,
    });
  }

  let tokens: OAuth2Tokens;

  try {
    tokens = await google.validateAuthorizationCode(code, codeVerifier);
  } catch (_error) {
    return new Response(null, {
      status: 400,
    });
  }

  const claims = decodeIdToken(tokens.idToken()) as GoogleClaims;
  const googleUserId = claims.sub;
  const { user: signedInUser } = await getCurrentSession();
  let status: "New" | "Existing" | "Linked" = "Linked";
  let user = await db
    .selectFrom("Accounts as a")
    .innerJoin("Users as u", "a.UserID", "u.UserID")
    .select(["u.UserID"])
    .where("a.AccountProviderAccountID", "=", googleUserId)
    .executeTakeFirst();

  if (signedInUser) {
    if (!user) {
      await db
        .insertInto("Accounts")
        .values({
          AccountAccessToken: tokens.accessToken(),
          AccountAccessTokenExpires: tokens.accessTokenExpiresAt(),
          AccountAddedBy: "LUCIA",
          AccountCompoundID: googleUserId,
          AccountProviderAccountID: googleUserId,
          AccountProviderID: "google",
          AccountProviderType: "oauth",
          AccountUpdatedBy: "LUCIA",
          UserID: signedInUser.id,
        })
        .executeTakeFirstOrThrow();
    }

    return new Response(null, {
      headers: {
        Location: "/users/edit",
      },
      status: 302,
    });
  }

  if (!user) {
    user = await db.selectFrom("Users").select("UserID").where("UserEmail", "=", claims.email).executeTakeFirst();

    if (user) {
      status = "Existing";
    }
  }

  if (!user) {
    status = "New";
    const insertResult = await db
      .insertInto("Users")
      .values({
        UserAddedBy: "LUCIA",
        UserDoneRegistering: 0,
        UserEmail: claims.email,
        UserEmailVerified: claims.email_verified ? new Date() : null,
        UserFirstName: claims.given_name,
        UserImage: claims.picture,
        UserIsAdmin: 0,
        UserLastName: claims.family_name,
        UserName: claims.name,
        UserUpdatedBy: "LUCIA",
      })
      .executeTakeFirstOrThrow();

    user = { UserID: Number(insertResult.insertId) };
  }

  if (status !== "Linked") {
    await db
      .insertInto("Accounts")
      .values({
        AccountAccessToken: tokens.accessToken(),
        AccountAccessTokenExpires: tokens.accessTokenExpiresAt(),
        AccountAddedBy: "LUCIA",
        AccountCompoundID: googleUserId,
        AccountProviderAccountID: googleUserId,
        AccountProviderID: "google",
        AccountProviderType: "oauth",
        AccountUpdatedBy: "LUCIA",
        UserID: user.UserID,
      })
      .executeTakeFirstOrThrow();
  }

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.UserID);

  await setSessionTokenCookie(sessionToken, session.expiresAt);

  return new Response(null, {
    headers: {
      Location: "/",
    },
    status: 302,
  });
};
