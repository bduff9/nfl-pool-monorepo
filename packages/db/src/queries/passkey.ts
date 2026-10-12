import type { Selectable } from "kysely";

import type { Passkeys } from "..";
import { db } from "../kysely";

export type PasskeyRow = Selectable<Passkeys>;

export const getPasskeysByUserId = (userId: number): Promise<PasskeyRow[]> =>
  db.selectFrom("Passkeys").selectAll().where("UserID", "=", userId).orderBy("PasskeyAdded", "asc").execute();

export const getPasskeyByCredentialId = (credentialId: string): Promise<PasskeyRow | undefined> =>
  db.selectFrom("Passkeys").selectAll().where("PasskeyCredentialID", "=", credentialId).executeTakeFirst();
