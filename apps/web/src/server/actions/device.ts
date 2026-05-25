"use server";

import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { type } from "arktype";
import webpush from "web-push";

import { env } from "@/lib/env";
import { authActionClient } from "@/lib/safe-action";
import { serverActionResultSchema } from "@/lib/validation";

webpush.setVapidDetails("mailto:info@asitewithnoname.com", env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);

export const subscribeUser = authActionClient
  .inputSchema(type({ agent: "string", subscription: "string" }))
  .outputSchema(serverActionResultSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { agent, subscription } = parsedInput;

    try {
      await db
        .insertInto("Devices")
        .values({
          DeviceAddedBy: ctx.user.email,
          DeviceSub: subscription,
          DeviceType: agent,
          DeviceUpdatedBy: ctx.user.email,
          UserID: ctx.user.id,
        })
        .executeTakeFirstOrThrow();
    } catch (error) {
      console.error("Error subscribing user:", error);

      if (error instanceof Error) {
        throw error;
      }

      throw new Error("Error subscribing user's device");
    }

    return { metadata: {}, status: "Success" };
  });

export const unsubscribeUser = authActionClient
  .inputSchema(type({ agent: "string", subscription: "string" }))
  .outputSchema(serverActionResultSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { subscription } = parsedInput;

    try {
      await db
        .deleteFrom("Devices")
        .where("UserID", "=", ctx.user.id)
        .where("DeviceSub", "=", subscription)
        .executeTakeFirstOrThrow();
    } catch (error) {
      console.error("Error unsubscribing user:", error);

      if (error instanceof Error) {
        throw error;
      }

      throw new Error("Error unsubscribing user's device");
    }

    return { metadata: {}, status: "Success" };
  });
