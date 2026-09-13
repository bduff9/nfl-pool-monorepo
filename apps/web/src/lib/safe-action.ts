import "server-only";

import { createSafeActionClient } from "next-safe-action";

import { getCurrentSession } from "@/server/loaders/sessions";

/**
 * Thrown for intentional, user-facing failures. Anything else escaping an action is
 * treated as an unexpected internal error and reported to clients with a generic message,
 * so driver/infrastructure details never leak through server responses.
 */
export class ActionError extends Error {}

const GENERIC_ACTION_ERROR_MESSAGE = "Something went wrong, please try again.";

export const actionClient = createSafeActionClient({
  handleServerError: (error) => {
    console.error("Action error:", error.message);

    if (error instanceof ActionError) {
      return error.message;
    }

    return GENERIC_ACTION_ERROR_MESSAGE;
  },
});

export const authActionClient = actionClient.use(async ({ next }) => {
  const context = await getCurrentSession();

  if (!context.user) {
    throw new ActionError("Unauthorized");
  }

  return next({ ctx: context });
});

export const adminActionClient = authActionClient.use(async ({ next, ctx }) => {
  if (ctx.user.isAdmin !== 1) {
    throw new ActionError("Unauthorized");
  }

  return next({ ctx });
});
