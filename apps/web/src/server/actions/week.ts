"use server";
import { cookies } from "next/headers";
import "server-only";

import { DAYS_IN_WEEK, HOURS_IN_DAY, MINUTES_IN_HOUR, SECONDS_IN_MINUTE } from "@/lib/constants";
import { serverActionResultSchema, weekSchema } from "@/lib/zod";
import { authedProcedure } from "@/lib/zsa.server";

export const setSelectedWeek = authedProcedure
  .input(weekSchema)
  .output(serverActionResultSchema)
  .handler(async ({ input }) => {
    const cookieStore = await cookies();

    cookieStore.set("selectedWeek", input.toString(), {
      maxAge: DAYS_IN_WEEK * HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE,
    });

    return {
      error: "",
      metadata: {},
      status: "Success",
    };
  });
