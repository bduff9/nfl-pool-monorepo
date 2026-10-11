import type { Users } from "@nfl-pool-monorepo/db/src";
import type { Selectable } from "kysely";

import type { EmailTypes } from "../emails/types";
import { sendSMS } from ".";

type ReminderSMSOptions = {
  hoursLeft: number;
  /** Names the reminder in the failure log, e.g. "pick" logs "Failed to send pick reminder sms:". */
  label: string;
  message: string;
  type: Extract<(typeof EmailTypes)[number], "pickReminder" | "survivorReminder">;
  user: Pick<Selectable<Users>, "UserFirstName" | "UserPhone">;
  week: number;
};

// Texts the reminder, logging instead of throwing so one failed text cannot stop the rest of the batch.
export const sendReminderSMS = async ({
  hoursLeft,
  label,
  message,
  type,
  user,
  week,
}: ReminderSMSOptions): Promise<void> => {
  try {
    if (!user.UserPhone) {
      throw new Error("Missing phone number for user!");
    }

    await sendSMS(user.UserPhone, message, type);
  } catch (error) {
    console.error(`Failed to send ${label} reminder sms:`, {
      error,
      hoursLeft,
      type,
      user,
      week,
    });
  }
};
