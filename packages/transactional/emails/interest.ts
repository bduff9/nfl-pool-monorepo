

import { getPaymentDueDate, getPoolCost, getSurvivorCost, getSystemYear } from "@nfl-pool-monorepo/db/src/queries/systemValue";

import { getBaseEmailClass, getBrowserLink, getUnsubscribeLink, sendEmail, updateEmailClass } from ".";
import { getHtml, getPlainText, getSubject } from "./templates/InterestEmail";

export const sendInterestEmail = async (
  to: { UserEmail: string | null; UserFirstName: string | null },
  isFinal = false,
): Promise<void> => {
      if (!to.UserEmail) {
        throw new Error('No email address provided');
      }

      const sendTo = [to.UserEmail];
      const emailId = await getBaseEmailClass({ to: sendTo, type: "interest" });
      const browserLink = getBrowserLink(emailId);
      const unsubscribeLink = getUnsubscribeLink(sendTo);
      const poolYear = await getSystemYear();
      const payByDateRaw = await getPaymentDueDate();
      const formatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'full' });
      const payByDate = formatter.format(payByDateRaw);
      const poolCost = await getPoolCost();
      const survivorCost = await getSurvivorCost();
      const html = await getHtml({
        browserLink,
        isFinal,
        payByDate,
        poolCost,
        poolYear,
        survivorCost,
        unsubscribeLink,
        userFirstName: to.UserFirstName ?? 'player',
      });
      const text = await getPlainText({
        browserLink,
        isFinal,
        payByDate,
        poolCost,
        poolYear,
        survivorCost,
        unsubscribeLink,
        userFirstName: to.UserFirstName ?? 'player',
      });
      const subject = getSubject(poolYear, isFinal);

      try {
        await sendEmail({
          html,
          subject,
          text,
          to: sendTo,
        });
      } catch (error) {
        console.error("Failed to send interest email: ", {
          error,
          props: {
            browserLink,
            isFinal,
            payByDate,
            poolCost,
            poolYear,
            survivorCost,
            unsubscribeLink,
            userFirstName: to.UserFirstName ?? 'player',
          },
          to,
          type: "interest",
        });
      }

      await updateEmailClass({
        emailId,
        html,
        subject,
        text,
      });
};
