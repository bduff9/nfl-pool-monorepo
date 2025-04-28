import type { SendEmailCommandInput } from "@aws-sdk/client-ses";
import { SES } from "@aws-sdk/client-ses";
import { db } from "@nfl-pool-monorepo/db/src/kysely";

import { EMAIL_SUBJECT_PREFIX } from "../src/constants";
import { env } from "../src/env";
import { EmailTypes } from "./types";

export const getBaseEmailClass = async ({
  type,
  to,
  bcc,
}: { type: (typeof EmailTypes)[number] } & (
  | { bcc: string[]; to?: never }
  | { bcc?: never; to: string[] }
)): Promise<string | null> => {
  const emails = bcc ?? to ?? [];

  try {
    const id = crypto.randomUUID();
    await db.insertInto('Emails').values({
      EmailID: id,
      EmailCreatedAt: new Date(),
      EmailTo: [...new Set(emails)].join(', '),
      EmailType: type,
    }).executeTakeFirstOrThrow();

    return id;
  } catch (error) {
    console.error("Failed to create email record in DynamoDB:", {
      emailType: type,
      error,
      to: new Set(emails),
    });
  }

  return null;
};

export const getBrowserLink = (emailId: string | null): string =>
  emailId ? `${env.domain}/api/email/${emailId}` : "";

export const getUnsubscribeLink = (toEmails: string[]): string =>
  `${env.domain}/api/email/unsubscribe${
    toEmails.length === 1 && toEmails[0] ? `?email=${encodeURIComponent(toEmails[0])}` : ""
  }`;

const ses = new SES({
  credentials: { accessKeyId: env.AWS_AK_ID, secretAccessKey: env.AWS_SAK_ID },
  region: env.AWS_R,
});

export const sendEmail = async ({
  bcc,
  to,
  subject,
  html,
  text,
}: {
  bcc?: string[];
  to: string[];
  subject: string;
  html: string;
  text: string;
}): Promise<void> => {
  const params: SendEmailCommandInput = {
    Destination: {
      BccAddresses: bcc,
      ToAddresses: to,
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: html,
        },
        Text: {
          Charset: "UTF-8",
          Data: text,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: `${EMAIL_SUBJECT_PREFIX}${subject}`,
      },
    },
    Source: env.EMAIL_FROM,
  };

  await ses.sendEmail(params);
};

export const updateEmailClass = async ({
  emailId,
  html,
  subject,
  text,
}: {
  emailId: string | null;
  html: string;
  subject: string;
  text: string;
}): Promise<void> => {
  if (!emailId) {
    console.warn("Failed to update email record: emailId is null");

    return;
  }

  try {
    await db.updateTable('Emails').set({
      EmailHtml: html,
      EmailSubject: `${EMAIL_SUBJECT_PREFIX}${subject}`,
      EmailTextOnly: text,
      EmailUpdatedAt: new Date(),
    }).where('EmailID', '=', emailId).executeTakeFirstOrThrow();
  } catch (error) {
    console.error("Failed to update email record:", { emailId, error });
  }
};
