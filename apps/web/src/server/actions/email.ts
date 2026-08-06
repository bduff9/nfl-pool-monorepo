"use server";

import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { sendCustomEmail } from "@nfl-pool-monorepo/transactional/emails/custom";
import { sendInterestEmail } from "@nfl-pool-monorepo/transactional/emails/interest";
import {
  getHtml as getCustomHtml,
  getPlainText as getCustomPlainText,
} from "@nfl-pool-monorepo/transactional/emails/templates/CustomEmail";

import { actionClient, adminActionClient } from "@/lib/safe-action";
import { emailPreviewSchema, sendAdminEmailSchema, serverActionResultSchema } from "@/lib/validation";
import "server-only";

import { type } from "arktype";

import { getCurrentSession } from "../loaders/sessions";

export const getEmailPreview = adminActionClient
  .inputSchema(emailPreviewSchema)
  .outputSchema(serverActionResultSchema)
  .action(async ({ parsedInput }) => {
    const { emailType, subject, body, preview, userFirstName } = parsedInput;

    if (emailType !== "Custom") {
      throw new Error(`Invalid email type: ${emailType}`);
    }

    const [html, text] = await Promise.all([
      getCustomHtml({
        browserLink: "",
        html: body,
        preview,
        subject,
        unsubscribeLink: "",
        userFirstName,
      }),
      getCustomPlainText({
        browserLink: "",
        html: body,
        preview,
        subject,
        unsubscribeLink: "",
        userFirstName,
      }),
    ]);

    return {
      metadata: {
        html,
        subject,
        text,
      },
      status: "Success",
    };
  });

export const sendAdminEmail = adminActionClient
  .inputSchema(sendAdminEmailSchema)
  .outputSchema(serverActionResultSchema)
  .action(async ({ parsedInput }) => {
    const { emailType, preview, sendTo, subject, body, userFirstName, userEmail } = parsedInput;
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

        if (error instanceof Error) {
          throw error;
        }

        throw new Error("Failed to send admin email");
      }
    }

    const results = await Promise.allSettled(promises);
    const failed = results.filter((result) => result.status === "rejected");

    if (failed.length > 0) {
      console.error("Failed to send some admin emails", {
        failedCount: failed.length,
        reasons: failed.map((result) => result.reason),
        totalCount: results.length,
      });
    }

    return {
      metadata: {
        failedCount: failed.length,
        totalCount: results.length,
      },
      status: "Success",
    };
  });

export const unsubscribe = actionClient
  .inputSchema(
    type({
      email: "string.email",
    }),
  )
  .outputSchema(serverActionResultSchema)
  .action(async ({ parsedInput }) => {
    const { user } = await getCurrentSession();
    const { email } = parsedInput;

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

      if (error instanceof Error) {
        throw error;
      }

      throw new Error("Failed to unsubscribe");
    }

    return {
      metadata: {},
      status: "Success",
    };
  });
