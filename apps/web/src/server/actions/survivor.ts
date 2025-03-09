"use server";
import "server-only";

import { serverActionResultSchema } from "@/lib/zod";
import { authedProcedure } from "@/lib/zsa.server";

export const registerForSurvivor = authedProcedure.output(serverActionResultSchema).handler(async ({ ctx }) => {
  if (ctx.user.playsSurvivor) {
    return {
      error: "Already registered for survivor",
      metadata: {},
      status: "Error",
    };
  }

  //TODO: Complete this function

  return {
    error: "",
    metadata: {},
    status: "Success",
  };
});

export const unregisterForSurvivor = authedProcedure.output(serverActionResultSchema).handler(async ({ ctx }) => {
  if (!ctx.user.playsSurvivor) {
    return {
      error: "Not registered for survivor",
      metadata: {},
      status: "Error",
    };
  }

  //TODO: Complete this function

  return {
    error: "",
    metadata: {},
    status: "Success",
  };
});
