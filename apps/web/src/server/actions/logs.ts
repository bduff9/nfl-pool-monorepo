"use server";

import { db } from "@nfl-pool-monorepo/db/src/kysely";
import "server-only";

import type { FormState } from "@/lib/types";
import { getCurrentSession } from "@/server/loaders/sessions";
import type { Logs } from "@nfl-pool-monorepo/db/src";

export const writeLog = async ({
  LeagueID,
  LogAction,
  LogMessage,
  LogData,
  userId,
}: {
  LeagueID?: number;
  LogAction: Logs["LogAction"];
  LogMessage: null | string;
  LogData: null | string;
  userId?: number;
}): Promise<FormState> => {
  const { user } = await getCurrentSession();

  //TODO: zod validation

  if (!userId) {
    userId = user?.id;
  }

  const auditUser = userId?.toString() ?? "unknown";

  await db
    .insertInto("Logs")
    .values({
      LeagueID,
      LogAction,
      LogAddedBy: auditUser,
      LogMessage,
      LogData,
      LogUpdatedBy: auditUser,
      UserID: userId,
    })
    .executeTakeFirstOrThrow();

  return {
    fieldErrors: {},
    message: "",
    status: "SUCCESS",
    timestamp: Date.now(),
  };
};
