import "server-only";

import { createServerActionProcedure, ZSAError } from "zsa";

import { getCurrentSession } from "@/server/loaders/sessions";

const baseAuthedProcedure = createServerActionProcedure().handler(async () => {
  const context = await getCurrentSession();

  if (!context.user) {
    throw new ZSAError("FORBIDDEN", "Unauthorized");
  }

  return context;
});

export const authedProcedure = baseAuthedProcedure.createServerAction();

export const adminProcedure = createServerActionProcedure(baseAuthedProcedure)
  .handler(async ({ ctx }) => {
    if (ctx.user.isAdmin !== 1) {
      throw new ZSAError("FORBIDDEN", "Unauthorized");
    }

    return ctx;
  })
  .createServerAction();
