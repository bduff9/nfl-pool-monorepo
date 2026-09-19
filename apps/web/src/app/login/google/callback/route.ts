import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { type } from "arktype";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import { createSession, generateSessionToken, google, sanitizeRedirectPath, setSessionTokenCookie } from "@/lib/auth";
import { AuthVerificationError, verifyLoginEligibility, verifyRegistrationEligibility } from "@/lib/auth-verification";
import { decodeGoogleIdToken, type GoogleTokens } from "@/lib/googleOAuth";
import { getCurrentSession } from "@/server/loaders/sessions";

const googleClaimsSchema = type({
  aud: "string",
  azp: "string",
  email: "string.email",
  email_verified: "boolean",
  exp: "number",
  family_name: "string",
  given_name: "string",
  iat: "number",
  iss: "string",
  name: "string",
  picture: "string",
  sub: "string",
});

type GoogleClaims = typeof googleClaimsSchema.infer;
type GoogleUserStatus = "Existing" | "Linked" | "New";
type CookieStore = Awaited<ReturnType<typeof cookies>>;

// fallow-ignore-next-line complexity -- 5 independent validity checks on unrelated inputs; a single combined guard, not decomposable
const validateCallbackParams = (url: URL, cookieStore: CookieStore): { code: string; codeVerifier: string } | null => {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = cookieStore.get("google_oauth_state")?.value ?? null;
  const codeVerifier = cookieStore.get("google_code_verifier")?.value ?? null;

  if (code === null || state === null || storedState === null || codeVerifier === null || state !== storedState) {
    return null;
  }

  return { code, codeVerifier };
};

const exchangeCodeForClaims = async (
  code: string,
  codeVerifier: string,
): Promise<{ claims: GoogleClaims; tokens: GoogleTokens } | null> => {
  let tokens: GoogleTokens;

  try {
    tokens = await google.validateAuthorizationCode(code, codeVerifier);
  } catch (error) {
    console.error("Failed to validate Google authorization code", error);

    return null;
  }

  const claims = googleClaimsSchema(decodeGoogleIdToken(tokens.idToken));

  if (claims instanceof type.errors) {
    console.error("Invalid Google ID token claims", claims.summary);

    return null;
  }

  return { claims, tokens };
};

const findLinkedUserId = async (googleUserId: string): Promise<number | null> => {
  const user = await db
    .selectFrom("Accounts as a")
    .innerJoin("Users as u", "a.UserID", "u.UserID")
    .select(["u.UserID"])
    .where("a.AccountProviderAccountID", "=", googleUserId)
    .executeTakeFirst();

  return user?.UserID ?? null;
};

const upsertGoogleAccount = async (googleUserId: string, tokens: GoogleTokens, userId: number): Promise<void> => {
  await db
    .insertInto("Accounts")
    .values({
      AccountAccessToken: tokens.accessToken,
      AccountAccessTokenExpires: tokens.accessTokenExpiresAt,
      AccountAddedBy: "LUCIA",
      AccountCompoundID: googleUserId,
      AccountProviderAccountID: googleUserId,
      AccountProviderID: "google",
      AccountProviderType: "oauth",
      AccountUpdatedBy: "LUCIA",
      UserID: userId,
    })
    .executeTakeFirstOrThrow();
};

const linkGoogleAccountToSignedInUser = async (
  googleUserId: string,
  tokens: GoogleTokens,
  signedInUserId: number,
  alreadyLinked: boolean,
): Promise<Response> => {
  if (!alreadyLinked) {
    await upsertGoogleAccount(googleUserId, tokens, signedInUserId);
  }

  return new Response(null, {
    headers: { Location: "/users/edit" },
    status: 302,
  });
};

// fallow-ignore-next-line complexity -- linked/existing-by-email/new is a genuine 3-way domain branch, not further reducible
const resolveUserForGoogleLogin = async (
  claims: GoogleClaims,
  linkedUserId: number | null,
): Promise<{ status: GoogleUserStatus; userId: number } | Response> => {
  if (linkedUserId !== null) {
    return { status: "Linked", userId: linkedUserId };
  }

  const existingUserByEmail = await db
    .selectFrom("Users")
    .select("UserID")
    .where("UserEmail", "=", claims.email)
    .executeTakeFirst();

  if (existingUserByEmail) {
    if (!claims.email_verified) {
      return new Response(
        "This Google account's email address isn't verified. Please log in with your password instead.",
        {
          status: 403,
        },
      );
    }

    return { status: "Existing", userId: existingUserByEmail.UserID };
  }

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

  return { status: "New", userId: Number(insertResult.insertId) };
};

const checkGoogleUserEligibility = async (status: GoogleUserStatus, userId: number): Promise<Response | null> => {
  try {
    if (status === "New") {
      await verifyRegistrationEligibility();
    } else {
      const existingUser = await db
        .selectFrom("Users")
        .select(["UserID", "UserDoneRegistering", "UserTrusted"])
        .where("UserID", "=", userId)
        .executeTakeFirstOrThrow();
      await verifyLoginEligibility(existingUser);
    }
  } catch (error) {
    if (error instanceof AuthVerificationError) {
      return new Response(error.message, {
        status: error.statusCode,
      });
    }

    throw error;
  }

  return null;
};

// fallow-ignore-next-line complexity -- already extracted into 6 named steps (was CRITICAL/600 CRAP as one function); this orchestrator's remaining branching is the OAuth login flow's own control flow
export const GET = async (request: NextRequest, _ctx: RouteContext<"/login/google/callback">): Promise<Response> => {
  const cookieStore = await cookies();
  const params = validateCallbackParams(new URL(request.url), cookieStore);

  if (!params) {
    return new Response(null, { status: 400 });
  }

  const exchange = await exchangeCodeForClaims(params.code, params.codeVerifier);

  if (!exchange) {
    return new Response(null, { status: 400 });
  }

  const { claims, tokens } = exchange;
  const googleUserId = claims.sub;
  const { user: signedInUser } = await getCurrentSession();
  const linkedUserId = await findLinkedUserId(googleUserId);

  if (signedInUser) {
    return linkGoogleAccountToSignedInUser(googleUserId, tokens, signedInUser.id, linkedUserId !== null);
  }

  const resolution = await resolveUserForGoogleLogin(claims, linkedUserId);

  if (resolution instanceof Response) {
    return resolution;
  }

  const { status, userId } = resolution;

  if (status !== "Linked") {
    await upsertGoogleAccount(googleUserId, tokens, userId);
  }

  const eligibilityError = await checkGoogleUserEligibility(status, userId);

  if (eligibilityError) {
    return eligibilityError;
  }

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, userId);

  await setSessionTokenCookie(sessionToken, session.expiresAt);

  const redirectTo = sanitizeRedirectPath(cookieStore.get("redirect_to")?.value, "/");

  return new Response(null, {
    headers: {
      Location: redirectTo,
    },
    status: 302,
  });
};
