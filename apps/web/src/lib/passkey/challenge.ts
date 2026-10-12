import { randomBytes } from "node:crypto";

import { cookies } from "next/headers";
import "server-only";

const PASSKEY_CHALLENGE_COOKIE = "passkey_challenge";
const PASSKEY_CHALLENGE_TTL_MS = 5 * 60 * 1000;

export const registrationChallengeIdentifier = (userId: number): string => `passkey-reg:${userId}`;

export const authenticationChallengeIdentifier = (challengeId: string): string => `passkey-auth:${challengeId}`;

/** Random, unguessable id handed to the browser in a cookie; the challenge itself never leaves the server except in the options. */
export const generateChallengeId = (): string => randomBytes(32).toString("base64url");

export const getChallengeExpiry = (now: number = Date.now()): Date => new Date(now + PASSKEY_CHALLENGE_TTL_MS);

export const setChallengeCookie = async (challengeId: string): Promise<void> => {
  (await cookies()).set(PASSKEY_CHALLENGE_COOKIE, challengeId, {
    httpOnly: true,
    maxAge: PASSKEY_CHALLENGE_TTL_MS / 1000,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
};

export const readChallengeCookie = async (): Promise<string | undefined> =>
  (await cookies()).get(PASSKEY_CHALLENGE_COOKIE)?.value;

export const clearChallengeCookie = async (): Promise<void> => {
  (await cookies()).set(PASSKEY_CHALLENGE_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
};
