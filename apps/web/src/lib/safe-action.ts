import "server-only";

import { createSafeActionClient } from "next-safe-action";

import { getCurrentSession } from "@/server/loaders/sessions";

export const actionClient = createSafeActionClient({
  handleServerError: (error) => {
    console.error("Action error:", error.message);

    return error.message;
  },
});

export const authActionClient = actionClient.use(async ({ next }) => {
  const context = await getCurrentSession();

  if (!context.user) {
    throw new Error("Unauthorized");
  }

  return next({ ctx: context });
});

export const adminActionClient = authActionClient.use(async ({ next, ctx }) => {
  if (ctx.user.isAdmin !== 1) {
    throw new Error("Unauthorized");
  }

  return next({ ctx });
});
