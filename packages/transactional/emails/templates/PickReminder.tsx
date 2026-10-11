import { render } from "@react-email/render";
import * as React from "react";

import { env } from "../../src/env";
import type { Email } from "../../src/types";
import ReminderEmail, {
  getReminderSubject,
  type ReminderEmailProps,
  reminderPreviewProps,
} from "./_components/ReminderEmail";

const PickReminderEmail: Email<ReminderEmailProps> = ({
  browserLink,
  hoursLeft,
  userFirstName,
  week,
  unsubscribeLink,
}) => {
  const { domain } = env;

  return (
    <ReminderEmail
      actionHref={`${domain}/picks/set`}
      actionLabel="Make Picks"
      browserLink={browserLink}
      message={
        <React.Fragment>
          This is your friendly reminder that you have not submitted your picks yet for week {week} of the NFL
          confidence pool and you now have less than {hoursLeft} hours.
          <br />
          <br />
          Click the button below to make your picks.
        </React.Fragment>
      }
      preview="Don't lose out on points this week, act now to submit your picks!"
      unsubscribeLink={unsubscribeLink}
      userFirstName={userFirstName}
    />
  );
};

PickReminderEmail.PreviewProps = reminderPreviewProps;

export default PickReminderEmail;

export const getSubject = getReminderSubject;

export const getHtml = (props: Parameters<Email<ReminderEmailProps>>[0]) => render(<PickReminderEmail {...props} />);

export const getPlainText = (props: Parameters<Email<ReminderEmailProps>>[0]) =>
  render(<PickReminderEmail {...props} />, {
    plainText: true,
  });
