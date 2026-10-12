import { getPasskeysByUserId } from "@nfl-pool-monorepo/db/src/queries/passkey";
import { cache } from "react";
import "server-only";

export type PasskeySummary = {
  addedAt: Date;
  backedUp: boolean;
  id: number;
  lastUsedAt: Date | null;
  name: string;
};

/** Lists a user's passkeys for the profile page. Only display fields are returned - never key material. */
export const getMyPasskeys = cache(async (userId: number): Promise<PasskeySummary[]> => {
  const passkeys = await getPasskeysByUserId(userId);

  return passkeys.map((passkey) => ({
    addedAt: passkey.PasskeyAdded,
    backedUp: passkey.PasskeyBackedUp === 1,
    id: passkey.PasskeyID,
    lastUsedAt: passkey.PasskeyLastUsed,
    name: passkey.PasskeyName ?? "Passkey",
  }));
});
