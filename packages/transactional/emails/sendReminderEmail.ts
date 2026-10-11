import type { Users } from "@nfl-pool-monorepo/db/src";
import type { Selectable } from "kysely";

import { deliverEmail } from "./deliverEmail";
import type { ReminderEmailProps } from "./templates/_components/ReminderEmail";
import type { EmailTypes } from "./types";

type ReminderEmailOptions = {
  hoursLeft: number;
  /** Names the reminder in the failure log, e.g. "pick reminder" logs "Failed to send pick reminder email: ". */
  label: string;
  template: {
    getHtml: (props: ReminderEmailProps & { browserLink: string; unsubscribeLink: string }) => Promise<string>;
    getPlainText: (props: ReminderEmailProps & { browserLink: string; unsubscribeLink: string }) => Promise<string>;
    getSubject: (firstName: string) => string;
  };
  type: Extract<(typeof EmailTypes)[number], "pickReminder" | "survivorReminder">;
  user: Pick<Selectable<Users>, "UserEmail" | "UserFirstName">;
  week: number;
};

export const sendReminderEmail = async ({
  hoursLeft,
  label,
  template,
  type,
  user,
  week,
}: ReminderEmailOptions): Promise<void> => {
  await deliverEmail({
    buildProps: (links) => ({ ...links, hoursLeft, userFirstName: user.UserFirstName ?? "player", week }),
    getHtml: template.getHtml,
    getPlainText: template.getPlainText,
    label,
    subject: template.getSubject(user.UserFirstName ?? "player"),
    to: [user.UserEmail],
    type,
  });
};
