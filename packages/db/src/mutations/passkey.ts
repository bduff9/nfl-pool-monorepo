import type { Insertable } from "kysely";

import type { Passkeys } from "..";
import { db } from "../kysely";

const CHALLENGE_AUDIT_USER = "PASSKEY_CHALLENGE";
const CHALLENGE_IDENTIFIER_PREFIX = "passkey-";

type NewPasskey = Pick<
  Insertable<Passkeys>,
  | "UserID"
  | "PasskeyCredentialID"
  | "PasskeyPublicKey"
  | "PasskeyCounter"
  | "PasskeyTransports"
  | "PasskeyDeviceType"
  | "PasskeyBackedUp"
  | "PasskeyName"
> & { addedBy: string };

/**
 * Stores a WebAuthn challenge in VerificationRequests under `identifier`, replacing any previous
 * challenge for that identifier. Expired passkey challenges are cleaned up opportunistically.
 */
export const storeChallenge = async (identifier: string, challenge: string, expiresAt: Date): Promise<void> => {
  await db
    .deleteFrom("VerificationRequests")
    .where("VerificationRequestIdentifier", "like", `${CHALLENGE_IDENTIFIER_PREFIX}%`)
    .where("VerificationRequestExpires", "<", new Date())
    .execute();
  await db.deleteFrom("VerificationRequests").where("VerificationRequestIdentifier", "=", identifier).execute();
  await db
    .insertInto("VerificationRequests")
    .values({
      VerificationRequestAddedBy: CHALLENGE_AUDIT_USER,
      VerificationRequestExpires: expiresAt,
      VerificationRequestIdentifier: identifier,
      VerificationRequestToken: challenge,
      VerificationRequestUpdatedBy: CHALLENGE_AUDIT_USER,
    })
    .execute();
};

/**
 * Atomically takes the challenge stored under `identifier`: it is always deleted (single use, whether or not
 * verification later succeeds) and returned only if it had not expired and this caller won the delete.
 */
export const consumeChallenge = async (identifier: string): Promise<string | null> => {
  const row = await db
    .selectFrom("VerificationRequests")
    .select(["VerificationRequestID", "VerificationRequestToken", "VerificationRequestExpires"])
    .where("VerificationRequestIdentifier", "=", identifier)
    .executeTakeFirst();

  if (!row) {
    return null;
  }

  const result = await db
    .deleteFrom("VerificationRequests")
    .where("VerificationRequestID", "=", row.VerificationRequestID)
    .executeTakeFirst();

  if (Number(result.numDeletedRows) !== 1 || row.VerificationRequestExpires.getTime() < Date.now()) {
    return null;
  }

  return row.VerificationRequestToken;
};

export const insertPasskey = async ({ addedBy, ...passkey }: NewPasskey): Promise<void> => {
  await db
    .insertInto("Passkeys")
    .values({ ...passkey, PasskeyAddedBy: addedBy, PasskeyUpdatedBy: addedBy })
    .executeTakeFirstOrThrow();
};

export const recordPasskeyUse = async (passkeyId: number, counter: number, backedUp: boolean): Promise<void> => {
  const now = new Date();

  await db
    .updateTable("Passkeys")
    .set({
      PasskeyBackedUp: backedUp ? 1 : 0,
      PasskeyCounter: counter,
      PasskeyLastUsed: now,
      PasskeyUpdated: now,
      PasskeyUpdatedBy: "PASSKEY_LOGIN",
    })
    .where("PasskeyID", "=", passkeyId)
    .executeTakeFirstOrThrow();
};

/** Renames a passkey only if it belongs to `userId`. Returns whether a passkey was updated. */
export const renamePasskeyForUser = async (
  passkeyId: number,
  userId: number,
  name: string,
  updatedBy: string,
): Promise<boolean> => {
  const result = await db
    .updateTable("Passkeys")
    .set({ PasskeyName: name, PasskeyUpdated: new Date(), PasskeyUpdatedBy: updatedBy })
    .where("PasskeyID", "=", passkeyId)
    .where("UserID", "=", userId)
    .executeTakeFirst();

  return Number(result.numUpdatedRows) === 1;
};

/** Deletes a passkey only if it belongs to `userId`. Returns whether a passkey was deleted. */
export const deletePasskeyForUser = async (passkeyId: number, userId: number): Promise<boolean> => {
  const result = await db
    .deleteFrom("Passkeys")
    .where("PasskeyID", "=", passkeyId)
    .where("UserID", "=", userId)
    .executeTakeFirst();

  return Number(result.numDeletedRows) === 1;
};
