"use server";

import { db } from "@nfl-pool-monorepo/db/src/kysely";
import webpush from "web-push";
import z from "zod";
import { ZSAError } from "zsa";

import { env } from "@/lib/env";
import { serverActionResultSchema } from "@/lib/zod";
import { authedProcedure } from "@/lib/zsa.server";

webpush.setVapidDetails("mailto:info@asitewithnoname.com", env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);

export const subscribeUser = authedProcedure
  .input(z.object({ agent: z.string(), subscription: z.string() }))
  .output(serverActionResultSchema)
  .handler(async ({ ctx, input }) => {
    const { agent, subscription } = input;

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

      if (error instanceof ZSAError) {
        throw error;
      }

      throw new ZSAError("ERROR", "Error subscribing user's device");
    }

    return { metadata: {}, status: "Success" };
  });

export const unsubscribeUser = authedProcedure
  .input(z.object({ agent: z.string(), subscription: z.string() }))
  .output(serverActionResultSchema)
  .handler(async ({ ctx, input }) => {
    const { subscription } = input;

    try {
      await db
        .deleteFrom("Devices")
        .where("UserID", "=", ctx.user.id)
        .where("DeviceSub", "=", subscription)
        .executeTakeFirstOrThrow();
    } catch (error) {
      console.error("Error unsubscribing user:", error);

      if (error instanceof ZSAError) {
        throw error;
      }

      throw new ZSAError("ERROR", "Error unsubscribing user's device");
    }

    return { metadata: {}, status: "Success" };
  });
