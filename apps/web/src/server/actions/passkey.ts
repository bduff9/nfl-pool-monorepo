"use server";

import { db } from "@nfl-pool-monorepo/db/src/kysely";
import {
  consumeChallenge,
  deletePasskeyForUser,
  insertPasskey,
  recordPasskeyUse,
  renamePasskeyForUser,
  storeChallenge,
} from "@nfl-pool-monorepo/db/src/mutations/passkey";
import { getPasskeyByCredentialId, getPasskeysByUserId } from "@nfl-pool-monorepo/db/src/queries/passkey";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { type } from "arktype";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";

import { createSession, generateSessionToken, sanitizeRedirectPath, setSessionTokenCookie } from "@/lib/auth";
import { verifyLoginEligibility } from "@/lib/auth-verification";
import {
  authenticationChallengeIdentifier,
  clearChallengeCookie,
  generateChallengeId,
  getChallengeExpiry,
  readChallengeCookie,
  registrationChallengeIdentifier,
  setChallengeCookie,
} from "@/lib/passkey/challenge";
import { getPasskeyConfig } from "@/lib/passkey/config";
import {
  defaultPasskeyName,
  encodePublicKey,
  serializeTransports,
  toExcludeCredential,
  toWebAuthnCredential,
} from "@/lib/passkey/mapping";
import {
  authenticationResponseSchema,
  deletePasskeySchema,
  registrationResponseSchema,
  renamePasskeySchema,
} from "@/lib/passkey/schemas";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { ActionError, actionClient, authActionClient } from "@/lib/safe-action";
import { serverActionResultSchema } from "@/lib/validation";
import "server-only";

const CHALLENGE_EXPIRED_MESSAGE = "Your passkey request expired. Please try again.";
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

const enforceRateLimit = async (key: string, limit: number, windowMs: number): Promise<void> => {
  if (!(await checkRateLimit({ key, limit, windowMs }))) {
    throw new ActionError("Too many passkey attempts. Please try again later.");
  }
};

const requireChallenge = async (identifier: string): Promise<string> => {
  const challenge = await consumeChallenge(identifier);

  if (!challenge) {
    throw new ActionError(CHALLENGE_EXPIRED_MESSAGE);
  }

  return challenge;
};

export const getRegistrationOptions = authActionClient.action(async ({ ctx }) => {
  await enforceRateLimit(`passkey:register:user:${ctx.user.id}`, 20, ONE_HOUR_MS);

  const { rpID, rpName } = getPasskeyConfig();
  const existingPasskeys = await getPasskeysByUserId(ctx.user.id);
  const options = await generateRegistrationOptions({
    authenticatorSelection: { residentKey: "required", userVerification: "preferred" },
    excludeCredentials: existingPasskeys.map(toExcludeCredential),
    rpID,
    rpName,
    userDisplayName: ctx.user.name ?? ctx.user.email,
    userID: new TextEncoder().encode(String(ctx.user.id)),
    userName: ctx.user.email,
  });

  await storeChallenge(registrationChallengeIdentifier(ctx.user.id), options.challenge, getChallengeExpiry());

  return options;
});

const checkRegistrationResponse = async (
  response: typeof registrationResponseSchema.infer,
  expectedChallenge: string,
) => {
  const { origin, rpID } = getPasskeyConfig();

  try {
    const verification = await verifyRegistrationResponse({
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      response,
    });

    if (verification.verified) {
      return verification.registrationInfo;
    }
  } catch (error) {
    console.error("Passkey registration verification failed", error);
  }

  throw new ActionError("We couldn't verify your passkey. Please try again.");
};

export const verifyRegistration = authActionClient
  .inputSchema(type({ response: registrationResponseSchema }))
  .outputSchema(serverActionResultSchema)
  .action(async ({ ctx, parsedInput }) => {
    const challenge = await requireChallenge(registrationChallengeIdentifier(ctx.user.id));
    const { credential, credentialBackedUp, credentialDeviceType } = await checkRegistrationResponse(
      parsedInput.response,
      challenge,
    );

    if (await getPasskeyByCredentialId(credential.id)) {
      throw new ActionError("This passkey is already registered.");
    }

    const userAgent = (await headers()).get("user-agent");

    await insertPasskey({
      addedBy: ctx.user.email,
      PasskeyBackedUp: credentialBackedUp ? 1 : 0,
      PasskeyCounter: credential.counter,
      PasskeyCredentialID: credential.id,
      PasskeyDeviceType: credentialDeviceType,
      PasskeyName: defaultPasskeyName(userAgent, credentialDeviceType),
      PasskeyPublicKey: encodePublicKey(credential.publicKey),
      PasskeyTransports: serializeTransports(parsedInput.response.response.transports),
      UserID: ctx.user.id,
    });

    revalidatePath("/users/edit");

    return { metadata: {}, status: "Success" };
  });

export const getAuthenticationOptions = actionClient.action(async () => {
  await enforceRateLimit(`passkey:options:ip:${await getClientIp()}`, 30, FIFTEEN_MINUTES_MS);

  const options = await generateAuthenticationOptions({
    rpID: getPasskeyConfig().rpID,
    userVerification: "preferred",
  });
  const challengeId = generateChallengeId();

  await storeChallenge(authenticationChallengeIdentifier(challengeId), options.challenge, getChallengeExpiry());
  await setChallengeCookie(challengeId);

  return options;
});

/** Takes (and always invalidates) the login challenge referenced by the challenge cookie. */
const takeLoginChallenge = async (): Promise<string> => {
  const challengeId = await readChallengeCookie();

  await clearChallengeCookie();

  return requireChallenge(challengeId ? authenticationChallengeIdentifier(challengeId) : "passkey-auth:none");
};

const verifyAssertion = async (
  response: typeof authenticationResponseSchema.infer,
  passkey: NonNullable<Awaited<ReturnType<typeof getPasskeyByCredentialId>>>,
  expectedChallenge: string,
) => {
  const { origin, rpID } = getPasskeyConfig();

  try {
    const verification = await verifyAuthenticationResponse({
      credential: toWebAuthnCredential(passkey),
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      response,
    });

    if (verification.verified) {
      return verification.authenticationInfo;
    }
  } catch (error) {
    console.error("Passkey authentication verification failed", error);
  }

  throw new ActionError("We couldn't verify your passkey. Please try again or use another sign-in method.");
};

const getLoginUser = (userId: number) =>
  db
    .selectFrom("Users")
    .select(["UserID", "UserDoneRegistering", "UserTrusted"])
    .where("UserID", "=", userId)
    .executeTakeFirstOrThrow();

/** Same session creation as the password login: new session token, session cookie, then redirect_to handling. */
const startLoginSession = async (userId: number): Promise<string> => {
  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, userId);

  await setSessionTokenCookie(sessionToken, session.expiresAt);

  return sanitizeRedirectPath((await cookies()).get("redirect_to")?.value, "");
};

export const verifyAuthentication = actionClient
  .inputSchema(type({ response: authenticationResponseSchema }))
  .outputSchema(serverActionResultSchema)
  .action(async ({ parsedInput }) => {
    await enforceRateLimit(`passkey:login:ip:${await getClientIp()}`, 20, FIFTEEN_MINUTES_MS);

    // The challenge is consumed (single use) whether or not verification later succeeds, so it can never be replayed.
    const [challenge, passkey] = await Promise.all([
      takeLoginChallenge(),
      getPasskeyByCredentialId(parsedInput.response.id),
    ]);

    if (!passkey) {
      throw new ActionError("We don't recognize that passkey. Please use another sign-in method.");
    }

    const { credentialBackedUp, newCounter } = await verifyAssertion(parsedInput.response, passkey, challenge);

    await recordPasskeyUse(passkey.PasskeyID, newCounter, credentialBackedUp);
    await verifyLoginEligibility(await getLoginUser(passkey.UserID));

    return { metadata: { redirectTo: await startLoginSession(passkey.UserID) }, status: "Success" };
  });

export const renamePasskey = authActionClient
  .inputSchema(renamePasskeySchema)
  .outputSchema(serverActionResultSchema)
  .action(async ({ ctx, parsedInput }) => {
    const renamed = await renamePasskeyForUser(parsedInput.passkeyId, ctx.user.id, parsedInput.name, ctx.user.email);

    if (!renamed) {
      throw new ActionError("Passkey not found");
    }

    revalidatePath("/users/edit");

    return { metadata: {}, status: "Success" };
  });

export const deletePasskey = authActionClient
  .inputSchema(deletePasskeySchema)
  .outputSchema(serverActionResultSchema)
  .action(async ({ ctx, parsedInput }) => {
    if (!(await deletePasskeyForUser(parsedInput.passkeyId, ctx.user.id))) {
      throw new ActionError("Passkey not found");
    }

    revalidatePath("/users/edit");

    return { metadata: {}, status: "Success" };
  });
