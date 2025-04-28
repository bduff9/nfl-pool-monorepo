import "server-only";
import { createServerActionProcedure, ZSAError } from "zsa";

import { getCurrentSession } from "@/server/loaders/sessions";

export const authedProcedure = createServerActionProcedure()
  .handler(async () => {
    const context = await getCurrentSession();

    if (!context.user) {
      throw new ZSAError("FORBIDDEN", "Unauthorized");
    }

    return context;
  })
  .createServerAction();
