"use server";

import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { sendCustomEmail } from "@nfl-pool-monorepo/transactional/emails/custom";
import { sendInterestEmail } from "@nfl-pool-monorepo/transactional/emails/interest";
import {
  getHtml as getCustomHtml,
  getPlainText as getCustomPlainText,
} from "@nfl-pool-monorepo/transactional/emails/templates/CustomEmail";

import { emailPreviewSchema, sendAdminEmailSchema, serverActionResultSchema } from "@/lib/zod";
import { authedProcedure } from "@/lib/zsa.server";
import "server-only";

import { z } from "zod";
import { createServerAction, ZSAError } from "zsa";

import { getCurrentSession } from "../loaders/sessions";

export const getEmailPreview = authedProcedure
  .input(emailPreviewSchema)
  .output(serverActionResultSchema)
  .handler(async ({ ctx, input }) => {
    if (ctx.user.isAdmin === 0) {
      throw new ZSAError("FORBIDDEN", "User is not an admin");
    }

    const { emailType, subject, body, emailFormat, preview, userFirstName } = input;
    let html = "";
    let text = "";

    if (emailType === "Custom") {
      if (emailFormat === "html") {
        html = await getCustomHtml({
          browserLink: "",
          html: body,
          preview,
          subject,
          unsubscribeLink: "",
          userFirstName,
        });
      } else if (emailFormat === "text") {
        text = await getCustomPlainText({
          browserLink: "",
          html: body,
          preview,
          subject,
          unsubscribeLink: "",
          userFirstName,
        });
      }
    } else {
      throw new ZSAError("FORBIDDEN", `Invalid email type: ${emailType}`);
    }

    return {
      metadata: {
        html,
        subject,
        text,
      },
      status: "Success",
    };
  });

export const sendAdminEmail = authedProcedure
  .input(sendAdminEmailSchema)
  .output(serverActionResultSchema)
  .handler(async ({ ctx, input }) => {
    if (ctx.user.isAdmin === 0) {
      throw new ZSAError("FORBIDDEN", "User is not an admin");
    }

    const { emailType, preview, sendTo, subject, body, userFirstName, userEmail } = input;
    let users: { UserEmail: string | null; UserFirstName: string | null }[] = [];
    const promises: Promise<void>[] = [];

    if (sendTo === "All") {
      users = await db
        .selectFrom("Users")
        .select(["UserEmail", "UserFirstName"])
        .where("UserCommunicationsOptedOut", "=", 0)
        .execute();
    } else if (sendTo === "New") {
      users = [{ UserEmail: userEmail, UserFirstName: userFirstName }];
    } else if (sendTo === "Registered") {
      users = await db
        .selectFrom("Users")
        .select(["UserEmail", "UserFirstName"])
        .where("UserCommunicationsOptedOut", "=", 0)
        .where("UserDoneRegistering", "=", 1)
        .execute();
    } else if (sendTo === "Unregistered") {
      users = await db
        .selectFrom("Users")
        .select(["UserEmail", "UserFirstName"])
        .where("UserCommunicationsOptedOut", "=", 0)
        .where("UserDoneRegistering", "=", 0)
        .execute();
    }

    for (const to of users) {
      try {
        if (emailType === "Custom") {
          promises.push(
            sendCustomEmail({
              body,
              preview,
              subject,
              to,
            }),
          );
        } else if (emailType === "Interest") {
          promises.push(sendInterestEmail(to, false));
        } else if (emailType === "Interest - Final") {
          promises.push(sendInterestEmail(to, true));
        }
      } catch (error) {
        console.error("Failed to send admin email", error);

        if (error instanceof ZSAError) {
          throw error;
        }

        throw new ZSAError("INTERNAL_SERVER_ERROR", "Failed to send admin email");
      }
    }

    await Promise.allSettled(promises);

    return {
      metadata: {},
      status: "Success",
    };
  });

export const unsubscribe = createServerAction()
  .input(
    z.object({
      email: z.string().email(),
    }),
  )
  .output(serverActionResultSchema)
  .handler(async ({ input }) => {
    const { user } = await getCurrentSession();
    const { email } = input;

    try {
      await db.transaction().execute(async () => {
        await db
          .updateTable("Users")
          .set({
            UserCommunicationsOptedOut: 1,
          })
          .where("UserEmail", "=", email)
          .executeTakeFirstOrThrow();

        await db
          .insertInto("Logs")
          .values({
            LogAction: "UNSUBSCRIBE",
            LogAddedBy: email,
            LogMessage: `${email} has unsubscribed from all communications`,
            LogUpdated: new Date(),
            LogUpdatedBy: email,
            UserID: user?.id,
          })
          .executeTakeFirstOrThrow();
      });
    } catch (error) {
      console.error("Failed to unsubscribe", error);

      if (error instanceof ZSAError) {
        throw error;
      }

      throw new ZSAError("INTERNAL_SERVER_ERROR", "Failed to unsubscribe");
    }

    return {
      metadata: {},
      status: "Success",
    };
  });
