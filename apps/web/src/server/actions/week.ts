"use server";

import { cookies } from "next/headers";
import "server-only";

import { DAYS_IN_WEEK, HOURS_IN_DAY, MINUTES_IN_HOUR, SECONDS_IN_MINUTE } from "@nfl-pool-monorepo/utils/constants";
import { weekSchema } from "@nfl-pool-monorepo/utils/validation";

import { authActionClient } from "@/lib/safe-action";
import { serverActionResultSchema } from "@/lib/validation";

export const setSelectedWeek = authActionClient
  .inputSchema(weekSchema)
  .outputSchema(serverActionResultSchema)
  .action(async ({ parsedInput }) => {
    const cookieStore = await cookies();

    cookieStore.set("selectedWeek", parsedInput.toString(), {
      maxAge: DAYS_IN_WEEK * HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE,
    });

    return {
      error: "",
      metadata: {},
      status: "Success",
    };
  });
