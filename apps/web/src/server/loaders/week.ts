import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { getCurrentWeek } from "@nfl-pool-monorepo/db/src/queries/week";
import { cookies } from "next/headers";
import { cache } from "react";
import "server-only";

import { weekSchema } from "@nfl-pool-monorepo/utils/validation";

import { parseWeekParam } from "@/lib/weekSearchParams";

import { requireUser } from "./sessions";
import { weekFromCookie } from "./weekCookie";
import { gameStatusCountsQuery, toSeasonStatus } from "./weekStatus";

export const getCurrentWeekCached = cache(() => getCurrentWeek());

export const getSeasonStatus = cache(async () => {
  await requireUser();

  return toSeasonStatus(await gameStatusCountsQuery(db).executeTakeFirstOrThrow());
});

export const getSelectedWeek = cache(async (currentWeek?: number) => {
  await requireUser();

  const cookieStore = await cookies();

  return weekFromCookie(cookieStore.get("selectedWeek")?.value) || currentWeek || getCurrentWeekCached();
});

export const getSelectedWeekFromParams = cache(
  async (searchParams: Promise<{ [key: string]: string | string[] | undefined }>, currentWeek?: number) => {
    const params = await searchParams;
    const fromUrl = parseWeekParam(params.week);

    if (fromUrl) {
      return fromUrl;
    }

    return getSelectedWeek(currentWeek);
  },
);

export const getWeekStart = cache(async (week: number) => {
  await requireUser();

  weekSchema.assert(week);

  const { GameKickoff } = await db
    .selectFrom("Games")
    .select("GameKickoff")
    .where("GameWeek", "=", week)
    .orderBy("GameKickoff", "asc")
    .executeTakeFirstOrThrow();

  return GameKickoff;
});

export const getWeekStatus = cache(async (week: number) => {
  await requireUser();

  weekSchema.assert(week);

  return toSeasonStatus(await gameStatusCountsQuery(db).where("GameWeek", "=", week).executeTakeFirstOrThrow());
});
