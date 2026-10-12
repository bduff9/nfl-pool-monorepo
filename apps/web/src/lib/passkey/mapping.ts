import type { PasskeyRow } from "@nfl-pool-monorepo/db/src/queries/passkey";
import type { WebAuthnCredential } from "@simplewebauthn/server";

export const encodePublicKey = (publicKey: Uint8Array): string => Buffer.from(publicKey).toString("base64url");

const decodePublicKey = (encoded: string): Uint8Array<ArrayBuffer> => new Uint8Array(Buffer.from(encoded, "base64url"));

export const serializeTransports = (transports: readonly string[] | undefined): string | null =>
  transports?.length ? transports.join(",") : null;

const parseTransports = (stored: string | null): string[] => (stored ? stored.split(",").filter(Boolean) : []);

export const toWebAuthnCredential = (
  row: Pick<PasskeyRow, "PasskeyCredentialID" | "PasskeyPublicKey" | "PasskeyCounter" | "PasskeyTransports">,
): WebAuthnCredential => ({
  counter: Number(row.PasskeyCounter),
  id: row.PasskeyCredentialID,
  publicKey: decodePublicKey(row.PasskeyPublicKey),
  transports: parseTransports(row.PasskeyTransports),
});

export const toExcludeCredential = (
  row: Pick<PasskeyRow, "PasskeyCredentialID" | "PasskeyTransports">,
): { id: string; transports: string[] } => ({
  id: row.PasskeyCredentialID,
  transports: parseTransports(row.PasskeyTransports),
});

const DEVICE_NAMES: readonly (readonly [RegExp, string])[] = [
  [/iPhone/i, "iPhone passkey"],
  [/iPad/i, "iPad passkey"],
  [/Android/i, "Android passkey"],
  [/Macintosh|Mac OS X/i, "Mac passkey"],
  [/Windows/i, "Windows passkey"],
  [/CrOS/i, "Chromebook passkey"],
  [/Linux/i, "Linux passkey"],
];

/** Default label for a new passkey, derived from the registering browser's user agent (best effort). */
export const defaultPasskeyName = (userAgent: string | null | undefined, deviceType: string): string => {
  const match = DEVICE_NAMES.find(([pattern]) => pattern.test(userAgent ?? ""));

  if (match) {
    return match[1];
  }

  return deviceType === "singleDevice" ? "Security key" : "Passkey";
};
