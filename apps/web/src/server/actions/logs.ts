"use server";

import { db } from "@nfl-pool-monorepo/db/src/kysely";
import "server-only";

import type { Logs } from "@nfl-pool-monorepo/db/src";

import type { ServerActionResult } from "@/lib/validation";
import { getCurrentSession } from "@/server/loaders/sessions";

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
  userId?: number | undefined;
}): Promise<ServerActionResult> => {
  const { user } = await getCurrentSession();

  if (!userId) {
    userId = user?.id;
  }

  const auditUser = userId?.toString() ?? "unknown";

  try {
    await db
      .insertInto("Logs")
      .values({
        LeagueID,
        LogAction,
        LogAddedBy: auditUser,
        LogData,
        LogMessage,
        LogUpdatedBy: auditUser,
        UserID: userId,
      })
      .executeTakeFirstOrThrow();
  } catch (error) {
    // Logs.uk_LogMessage is unique on (UserID, LogAction, LogDate), and LogDate defaults to
    // CURRENT_TIMESTAMP at whole-second granularity - a second identical action by the same
    // user within the same second is an expected duplicate, not a real failure.
    if (!(error instanceof Error) || (error as NodeJS.ErrnoException).code !== "ER_DUP_ENTRY") {
      throw error;
    }
  }

  return {
    metadata: {},
    status: "Success",
  };
};
