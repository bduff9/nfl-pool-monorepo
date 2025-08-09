import { getBaseEmailClass, getBrowserLink, getUnsubscribeLink, sendEmail, updateEmailClass } from ".";
import { getHtml, getPlainText } from "./templates/CustomEmail";

export const sendCustomEmail = async ({
  body,
  preview,
  subject,
  to,
}: {
  body: string;
  preview: string;
  subject: string;
  to: { UserEmail: string | null; UserFirstName: string | null };
}): Promise<void> => {
  if (!to.UserEmail) {
    throw new Error("No email address provided");
  }

  const sendTo = [to.UserEmail];
  const emailId = await getBaseEmailClass({ to: sendTo, type: "custom" });
  const browserLink = getBrowserLink(emailId);
  const unsubscribeLink = getUnsubscribeLink(sendTo);
  const html = await getHtml({
    browserLink,
    html: body,
    preview,
    subject,
    unsubscribeLink,
    userFirstName: to.UserFirstName ?? "player",
  });
  const text = await getPlainText({
    browserLink,
    html: body,
    preview,
    subject,
    unsubscribeLink,
    userFirstName: to.UserFirstName ?? "player",
  });

  try {
    await sendEmail({
      html,
      subject,
      text,
      to: sendTo,
    });
  } catch (error) {
    console.error("Failed to send custom email: ", {
      error,
      props: {
        browserLink,
        html: body,
        preview,
        subject,
        unsubscribeLink,
        userFirstName: to.UserFirstName ?? "player",
      },
      to,
      type: "custom",
    });
  }

  await updateEmailClass({
    emailId,
    html,
    subject,
    text,
  });
};
