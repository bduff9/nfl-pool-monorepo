import { getBaseEmailClass, getBrowserLink, getUnsubscribeLink, sendEmail, updateEmailClass } from ".";
import type { EmailTypes } from "./types";

type SendAndRecordOptions = {
  emailId: string | null;
  html: string;
  /** Names the email in the failure log, e.g. "week ended" logs "Failed to send week ended email: ". */
  label: string;
  /** What the failure log records about the email's content. */
  logProps: unknown;
  subject: string;
  text: string;
  to: string[];
  type: (typeof EmailTypes)[number];
};

// Sends a rendered email, then stores what was sent. A failed send is logged rather than thrown so the record is
// still updated.
export const sendAndRecordEmail = async ({
  emailId,
  html,
  label,
  logProps,
  subject,
  text,
  to,
  type,
}: SendAndRecordOptions): Promise<void> => {
  try {
    await sendEmail({
      html,
      subject,
      text,
      to,
    });
  } catch (error) {
    console.error(`Failed to send ${label} email: `, { error, props: logProps, to, type });
  }

  await updateEmailClass({
    emailId,
    html,
    subject,
    text,
  });
};

type DeliverEmailOptions<Props> = {
  buildProps: (links: { browserLink: string; unsubscribeLink: string }) => Props;
  getHtml: (props: Props) => Promise<string>;
  getPlainText: (props: Props) => Promise<string>;
  label: string;
  subject: string;
  to: string[];
  type: (typeof EmailTypes)[number];
};

// The shared send pipeline: create the Emails record, render the template, then send and record it.
export const deliverEmail = async <Props>({
  buildProps,
  getHtml,
  getPlainText,
  label,
  subject,
  to,
  type,
}: DeliverEmailOptions<Props>): Promise<void> => {
  const emailId = await getBaseEmailClass({ to, type });
  const props = buildProps({ browserLink: getBrowserLink(emailId), unsubscribeLink: getUnsubscribeLink(to) });
  const [html, text] = await Promise.all([getHtml(props), getPlainText(props)]);

  await sendAndRecordEmail({ emailId, html, label, logProps: props, subject, text, to, type });
};
