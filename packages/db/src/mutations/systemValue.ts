import { ADMIN_USER } from "@nfl-pool-monorepo/utils/constants";

import { db } from "../kysely";

/**
 * Sets a named SystemValue, inserting the row if it doesn't exist yet. Used for durable
 * one-time markers (e.g. week finalization flags) that scheduled jobs check before doing
 * non-idempotent work.
 */
export const setSystemValue = async (name: string, value: string): Promise<void> => {
  const result = await db
    .updateTable("SystemValues")
    .set({ SystemValueUpdated: new Date(), SystemValueUpdatedBy: ADMIN_USER, SystemValueValue: value })
    .where("SystemValueName", "=", name)
    .executeTakeFirstOrThrow();

  if (Number(result.numUpdatedRows) === 0) {
    await db
      .insertInto("SystemValues")
      .values({
        SystemValueAddedBy: ADMIN_USER,
        SystemValueName: name,
        SystemValueUpdatedBy: ADMIN_USER,
        SystemValueValue: value,
      })
      .executeTakeFirstOrThrow();
  }
};
