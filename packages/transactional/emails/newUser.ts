import type { Users } from "@nfl-pool-monorepo/db/src";
import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { getSystemYear } from "@nfl-pool-monorepo/db/src/queries/systemValue";
import type { Selectable } from "kysely";

import { getAdminNewUserEmailProps, getNewUserEmailProps } from "../src/adminNewUserEmailProps";
import { getBaseEmailClass, getBrowserLink, getUnsubscribeLink } from ".";
import { sendAndRecordEmail } from "./deliverEmail";
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
  const yearsPlayedArr = yearsPlayedResult.reduce<number[]>((acc, { UserHistoryYear }) => {
    if (UserHistoryYear !== currentYear) acc.push(UserHistoryYear);

    return acc;
  }, []);
  const isReturning = yearsPlayedArr.length > 0;
  const yearsPlayed = yearsPlayedArr.join(", ");

  await Promise.allSettled(
    admins.map(async (admin) => {
      const to = [admin.UserEmail];
      const emailId = await getBaseEmailClass({ to, type: "newUser" });
      const browserLink = getBrowserLink(emailId);
      const unsubscribeLink = getUnsubscribeLink(to);
      const subject = getSubject();
      const baseProps = getAdminNewUserEmailProps(admin, newUser, { browserLink, unsubscribeLink });
      const props = getNewUserEmailProps(baseProps, newUser, { isReturning, yearsPlayed });
      const [html, text] = await Promise.all([getHtml(props), getPlainText(props)]);

      await sendAndRecordEmail({
        emailId,
        html,
        label: "new user",
        logProps: baseProps,
        subject,
        text,
        to,
        type: "newUser",
      });
    }),
  );
};
