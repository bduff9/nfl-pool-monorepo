import type { Users } from "@nfl-pool-monorepo/db/src";
import type { Selectable } from "kysely";

import { sendReminderEmail } from "./sendReminderEmail";
import * as template from "./templates/PickReminder";

export const sendPickReminderEmail = async (
  user: Pick<Selectable<Users>, "UserEmail" | "UserFirstName">,
  week: number,
  hoursLeft: number,
): Promise<void> => {
  await sendReminderEmail({ hoursLeft, label: "pick reminder", template, type: "pickReminder", user, week });
};
