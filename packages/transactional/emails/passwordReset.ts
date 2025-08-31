import { getBaseEmailClass, getBrowserLink, getUnsubscribeLink, sendEmail, updateEmailClass } from ".";
import { getHtml, getPlainText, getSubject } from "./templates/PasswordResetEmail";

export const sendPasswordResetEmail = async (
  to: { UserEmail: string; UserFirstName?: string | null },
  otp: string,
): Promise<void> => {
  const sendTo = [to.UserEmail];
  const emailId = await getBaseEmailClass({ to: sendTo, type: "passwordReset" });
  const browserLink = getBrowserLink(emailId);
  const unsubscribeLink = getUnsubscribeLink(sendTo);
  const subject = getSubject();
  const html = await getHtml({
    browserLink,
    otp,
    unsubscribeLink,
    userFirstName: to.UserFirstName || undefined,
  });
  const text = await getPlainText({
    browserLink,
    otp,
    unsubscribeLink,
    userFirstName: to.UserFirstName || undefined,
  });

  try {
    await sendEmail({
      html,
      subject,
      text,
      to: sendTo,
    });
  } catch (error) {
    console.error("Failed to send password reset email: ", {
      error,
      props: {
        browserLink,
        otp,
        unsubscribeLink,
        userFirstName: to.UserFirstName ?? undefined,
      },
      to: sendTo,
      type: "passwordReset",
    });
  }

  await updateEmailClass({
    emailId,
    html,
    subject,
    text,
  });
};
