import type { Users } from "@nfl-pool-monorepo/db/src";
import { getPoolCost } from "@nfl-pool-monorepo/db/src/queries/systemValue";
import type { Selectable } from "kysely";

import { getBaseEmailClass, getBrowserLink, getUnsubscribeLink, sendEmail, updateEmailClass } from ".";
import { getHtml, getPlainText, getSubject } from "./templates/PrizesSetEmail";

type SendPrizesSetEmailArgs = {
  overall1stPrize: number;
  overall2ndPrize: number;
  overall3rdPrize: number;
  survivor1stPrize: number;
  survivor2ndPrize: number;
  user: Pick<Selectable<Users>, "UserEmail" | "UserFirstName">;
  weekly1stPrize: number;
  weekly2ndPrize: number;
};

export const sendPrizesSetEmail = async ({
  overall1stPrize,
  overall2ndPrize,
  overall3rdPrize,
  survivor1stPrize,
  survivor2ndPrize,
  user,
  weekly1stPrize,
  weekly2ndPrize,
}: SendPrizesSetEmailArgs): Promise<void> => {
  const overallLastPrize = await getPoolCost();
  const to = [user.UserEmail];
  const userFirstName = user.UserFirstName ?? "player";
  const emailId = await getBaseEmailClass({ to, type: "prizesSet" });
  const browserLink = getBrowserLink(emailId);
  const unsubscribeLink = getUnsubscribeLink(to);
  const subject = getSubject();
  const [html, text] = await Promise.all([
    getHtml({
      browserLink,
      overall1stPrize,
      overall2ndPrize,
      overall3rdPrize,
      overallLastPrize,
      survivor1stPrize,
      survivor2ndPrize,
      unsubscribeLink,
      userFirstName,
      weekly1stPrize,
      weekly2ndPrize,
    }),
    getPlainText({
      browserLink,
      overall1stPrize,
      overall2ndPrize,
      overall3rdPrize,
      overallLastPrize,
      survivor1stPrize,
      survivor2ndPrize,
      unsubscribeLink,
      userFirstName,
      weekly1stPrize,
      weekly2ndPrize,
    }),
  ]);

  try {
    await sendEmail({
      html,
      subject,
      text,
      to,
    });
  } catch (error) {
    console.error("Failed to send prizes set email: ", {
      error,
      props: {
        browserLink,
        overall1stPrize,
        overall2ndPrize,
        overall3rdPrize,
        overallLastPrize,
        survivor1stPrize,
        survivor2ndPrize,
        unsubscribeLink,
        userFirstName,
        weekly1stPrize,
        weekly2ndPrize,
      },
      to,
      type: "prizesSet",
    });
  }

  await updateEmailClass({
    emailId,
    html,
    subject,
    text,
  });
};
