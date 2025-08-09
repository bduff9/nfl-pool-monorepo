import type { Users } from "@nfl-pool-monorepo/db/src";
import { db } from "@nfl-pool-monorepo/db/src/kysely";
import type { Selectable } from "kysely";

import { getBaseEmailClass, getBrowserLink, getUnsubscribeLink, sendEmail, updateEmailClass } from ".";
import { getHtml, getPlainText, getSubject } from "./templates/UntrustedEmail";

export const sendUntrustedEmail = async (
  newUser: Pick<Selectable<Users>, "UserEmail" | "UserName" | "UserReferredByRaw">,
): Promise<void> => {
  const admins = await db
    .selectFrom("Users")
    .select(["UserFirstName", "UserEmail"])
    .where("UserIsAdmin", "=", 1)
    .execute();

  await Promise.allSettled(
    admins.map(async (admin) => {
      const to = [admin.UserEmail];
      const emailId = await getBaseEmailClass({ to, type: "untrusted" });
      const browserLink = getBrowserLink(emailId);
      const unsubscribeLink = getUnsubscribeLink(to);
      const subject = getSubject();
      const html = await getHtml({
        adminUserFirstName: admin.UserFirstName ?? "",
        browserLink,
        newUserUserEmail: newUser.UserEmail,
        newUserUserName: newUser.UserName ?? "",
        newUserUserReferredByRaw: newUser.UserReferredByRaw ?? "",
        unsubscribeLink,
      });
      const text = await getPlainText({
        adminUserFirstName: admin.UserFirstName ?? "",
        browserLink,
        newUserUserEmail: newUser.UserEmail,
        newUserUserName: newUser.UserName ?? "",
        newUserUserReferredByRaw: newUser.UserReferredByRaw ?? "",
        unsubscribeLink,
      });

      try {
        await sendEmail({
          html,
          subject,
          text,
          to,
        });
      } catch (error) {
        console.error("Failed to send untrusted email: ", {
          error,
          props: {
            adminUserFirstName: admin.UserFirstName ?? "",
            browserLink,
            newUserUserEmail: newUser.UserEmail,
            newUserUserName: newUser.UserName ?? "",
            newUserUserReferredByRaw: newUser.UserReferredByRaw ?? "",
            unsubscribeLink,
          },
          to,
          type: "untrusted",
        });
      }

      await updateEmailClass({
        emailId,
        html,
        subject,
        text,
      });
    }),
  );
};
