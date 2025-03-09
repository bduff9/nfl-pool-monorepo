import type { OAuth2Tokens } from "arctic";
import { decodeIdToken } from "arctic";
import { cookies } from "next/headers";

import { createSession, generateSessionToken, google, setSessionTokenCookie } from "@/lib/auth";
import { db } from "@nfl-pool-monorepo/db/src/kysely";

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
  let status: "New" | "Existing" | "Linked" = "Linked";

  let user = await db
    .selectFrom("Accounts as a")
    .innerJoin("Users as u", "a.UserID", "u.UserID")
    .select(["u.UserID"])
    .where("a.AccountProviderAccountID", "=", googleUserId)
    .executeTakeFirst();

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
        UserEmail: claims.email,
        UserFirstName: claims.given_name,
        UserLastName: claims.family_name,
        UserDoneRegistering: 0,
        UserIsAdmin: 0,
        UserName: claims.name,
        UserEmailVerified: claims.email_verified ? new Date() : null,
        UserImage: claims.picture,
        UserAddedBy: "LUCIA",
        UserUpdatedBy: "LUCIA",
      })
      .executeTakeFirstOrThrow();

    user = { UserID: Number(insertResult.insertId) };
  }

  if (status !== "Linked") {
    await db
      .insertInto("Accounts")
      .values({
        AccountCompoundID: googleUserId,
        UserID: user.UserID,
        AccountProviderType: "oauth",
        AccountProviderID: "google",
        AccountProviderAccountID: googleUserId,
        AccountAccessToken: tokens.accessToken(),
        AccountAccessTokenExpires: tokens.accessTokenExpiresAt(),
        AccountAddedBy: "LUCIA",
        AccountUpdatedBy: "LUCIA",
      })
      .executeTakeFirstOrThrow();
  }

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.UserID);

  await setSessionTokenCookie(sessionToken, session.expiresAt);

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/",
    },
  });
};
