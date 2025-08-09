/*******************************************************************************
 * NFL Confidence Pool BE - the backend implementation of an NFL confidence pool.
 * Copyright (C) 2015-present Brian Duffey
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see {http://www.gnu.org/licenses/}.
 * Home: https://asitewithnoname.com/
 */

import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { Twilio } from "twilio";

import type { EmailTypes } from "../emails/types";
import { EMAIL_SUBJECT_PREFIX } from "../src/constants";
import { env } from "../src/env";

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = env;
const twilioClient = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

export const getBaseSMSClass = async ({
  id,
  type,
  to,
}: {
  id: string;
  type: (typeof EmailTypes)[number];
  to: string;
}): Promise<void> => {
  try {
    await db
      .insertInto("Emails")
      .values({
        EmailCreatedAt: new Date(),
        EmailID: id,
        EmailTo: to,
        EmailType: type,
      })
      .executeTakeFirstOrThrow();
  } catch (error) {
    console.error("Failed to create SMS record in DB:", {
      emailType: type,
      error,
      to,
    });
  }
};

type TwilioError = {
  code: number;
  details?: string;
  moreInfo: string;
  status: number;
};

const isTwilioError = (obj: unknown): obj is TwilioError => typeof obj === "object" && obj !== null && "code" in obj;

const disableAllSMSForUser = async (phoneNumber: string): Promise<void> => {
  const user = await db.selectFrom("Users").select(["UserID"]).where("UserPhone", "=", phoneNumber).executeTakeFirst();

  if (!user) {
    console.warn("No user found with number to disable SMS notifications:", phoneNumber);

    return;
  }

  await db
    .updateTable("Notifications")
    .set({
      NotificationSMS: 0,
      NotificationSMSHoursBefore: null,
      NotificationUpdatedBy: "System",
    })
    .where("UserID", "=", user.UserID)
    .executeTakeFirstOrThrow();
  await db
    .updateTable("Users")
    .set({
      UserPhone: null,
      UserUpdatedBy: "System",
    })
    .where("UserID", "=", user.UserID)
    .executeTakeFirstOrThrow();
};

export const sendSMS = async (sendTo: string, message: string, type: (typeof EmailTypes)[number]): Promise<void> => {
  const { domain } = env;
  const to = sendTo.startsWith("+1") ? sendTo : `+1${sendTo}`;
  const body = `${EMAIL_SUBJECT_PREFIX}${message}\n${domain}`;
  const id = crypto.randomUUID();
  await getBaseSMSClass({
    id,
    to,
    type,
  });

  try {
    await twilioClient.messages.create({
      body,
      from: TWILIO_PHONE_NUMBER,
      to,
    });
  } catch (error) {
    if (isTwilioError(error) && error.code === 21610) {
      console.info("User has opted out of SMS, turning all their SMS notifications off", sendTo);
      await disableAllSMSForUser(sendTo);

      return;
    }

    throw error;
  }

  updateSMSClass({
    id,
    sms: body,
  });
};

export const updateSMSClass = async ({ id, sms }: { id: string; sms: string }): Promise<void> => {
  try {
    await db
      .updateTable("Emails")
      .set({
        EmailSms: sms,
      })
      .where("EmailID", "=", id)
      .executeTakeFirstOrThrow();
  } catch (error) {
    console.error("Failed to update SMS record:", { error, id });
  }
};
