import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { cache } from "react";
import "server-only";

import { weekSchema } from "@/lib/zod";
import { getCurrentSession } from "./sessions";

export const getMyTiebreaker = cache(async (week: number) => {
  const { user } = await getCurrentSession();

  if (!user) {
    throw new Error("Not logged in");
  }

  weekSchema.parse(week);

  return db
    .selectFrom("Tiebreakers")
    .selectAll()
    .where("TiebreakerWeek", "=", week)
    .where("UserID", "=", user.id)
    .executeTakeFirst();
});
