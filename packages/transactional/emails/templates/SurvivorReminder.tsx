import { render } from "@react-email/render";
import * as React from "react";

import { env } from "../../src/env";
import type { Email } from "../../src/types";
import ReminderEmail, {
  getReminderSubject,
  type ReminderEmailProps,
  reminderPreviewProps,
} from "./_components/ReminderEmail";

const SurvivorReminderEmail: Email<ReminderEmailProps> = ({
  browserLink,
  hoursLeft,
  userFirstName,
  week,
  unsubscribeLink,
}) => {
  const { domain } = env;

  return (
    <ReminderEmail
      actionHref={`${domain}/survivor/set`}
      actionLabel="Make Survivor Pick"
      browserLink={browserLink}
      message={
        <React.Fragment>
          This is your friendly reminder that you have not submitted your survivor pick yet for week {week} and you now
          have less than {hoursLeft} hours.
          <br />
          <br />
          Click the button below to make your pick.
        </React.Fragment>
      }
      preview="Don't fall out of survivor this week, act now to submit your survivor pick!"
      unsubscribeLink={unsubscribeLink}
      userFirstName={userFirstName}
    />
  );
};

SurvivorReminderEmail.PreviewProps = reminderPreviewProps;

export default SurvivorReminderEmail;

export const getSubject = getReminderSubject;

export const getHtml = (props: Parameters<Email<ReminderEmailProps>>[0]) =>
  render(<SurvivorReminderEmail {...props} />);

export const getPlainText = (props: Parameters<Email<ReminderEmailProps>>[0]) =>
  render(<SurvivorReminderEmail {...props} />, {
    plainText: true,
  });
