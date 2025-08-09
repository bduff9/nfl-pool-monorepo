import type { Users } from "@nfl-pool-monorepo/db/src";
import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { getSystemYear } from "@nfl-pool-monorepo/db/src/queries/systemValue";
import type { Selectable } from "kysely";

import { getBaseEmailClass, getBrowserLink, getUnsubscribeLink, sendEmail, updateEmailClass } from ".";
import { getHtml, getPlainText, getSubject } from "./templates/NewUserEmail";

export const sendNewUserEmail = async (
  newUser: Pick<Selectable<Users>, "UserID" | "UserEmail" | "UserName" | "UserReferredByRaw" | "UserTeamName">,
): Promise<void> => {
  const admins = await db
    .selectFrom("Users")
    .select(["UserFirstName", "UserEmail"])
    .where("UserIsAdmin", "=", 1)
    .execute();
  const yearsPlayedResult = await db
    .selectFrom("UserHistory")
    .select(["UserHistoryYear"])
    .where("UserID", "=", newUser.UserID)
    .execute();
  const currentYear = await getSystemYear();
  const yearsPlayedArr = yearsPlayedResult
    .map(({ UserHistoryYear }) => UserHistoryYear)
    .filter((year) => year !== currentYear);
  const isReturning = yearsPlayedArr.length > 0;
  const yearsPlayed = yearsPlayedArr.join(", ");

  await Promise.allSettled(
    admins.map(async (admin) => {
      const to = [admin.UserEmail];
      const emailId = await getBaseEmailClass({ to, type: "newUser" });
      const browserLink = getBrowserLink(emailId);
      const unsubscribeLink = getUnsubscribeLink(to);
      const subject = getSubject();
      const html = await getHtml({
        adminUserFirstName: admin.UserFirstName ?? "",
        browserLink,
        isReturning,
        newUserUserEmail: newUser.UserEmail,
        newUserUserName: newUser.UserName ?? "",
        newUserUserReferredByRaw: newUser.UserReferredByRaw ?? "",
        newUserUserTeamName: newUser.UserTeamName ?? "",
        unsubscribeLink,
        yearsPlayed,
      });
      const text = await getPlainText({
        adminUserFirstName: admin.UserFirstName ?? "",
        browserLink,
        isReturning,
        newUserUserEmail: newUser.UserEmail,
        newUserUserName: newUser.UserName ?? "",
        newUserUserReferredByRaw: newUser.UserReferredByRaw ?? "",
        newUserUserTeamName: newUser.UserTeamName ?? "",
        unsubscribeLink,
        yearsPlayed,
      });

      try {
        await sendEmail({
          html,
          subject,
          text,
          to,
        });
      } catch (error) {
        console.error("Failed to send new user email: ", {
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
          type: "newUser",
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
