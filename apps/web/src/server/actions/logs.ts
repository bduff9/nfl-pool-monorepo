"use server";

import { db } from "@nfl-pool-monorepo/db/src/kysely";
import "server-only";

import type { Logs } from "@nfl-pool-monorepo/db/src";

import type { ServerActionResult } from "@/lib/zod";
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

  return {
    metadata: {},
    status: "Success",
  };
};
