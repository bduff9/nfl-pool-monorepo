import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { env } from "./env";

const TOKEN_LENGTH = 32;

/**
 * Links embedded in emails must keep working for as long as the email exists, so tokens
 * are deterministic HMACs rather than expiring. The key is derived from secrets the apps
 * already share; EMAIL_LINK_SECRET adds explicit entropy when provided.
 */
const getTokenKey = (): string =>
  createHash("sha256")
    .update(`${env.DATABASE_URL}:${env.EMAIL_LINK_SECRET ?? ""}`)
    .digest("hex");

export const signEmailLink = (value: string): string =>
  createHmac("sha256", getTokenKey()).update(value).digest("hex").substring(0, TOKEN_LENGTH);

export const verifyEmailLink = (value: string, token: string | null | undefined): boolean => {
  if (!token || token.length !== TOKEN_LENGTH) {
    return false;
  }

  return timingSafeEqual(Buffer.from(signEmailLink(value)), Buffer.from(token));
};
