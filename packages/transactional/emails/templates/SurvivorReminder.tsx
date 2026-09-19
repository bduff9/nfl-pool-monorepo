import { render } from "@react-email/render";
import * as React from "react";
import { Container, Html, Preview } from "react-email";

import { env } from "../../src/env";
import type { Email } from "../../src/types";
import BodyWrapper from "./_components/BodyWrapper";
import Footer from "./_components/Footer";
import Header from "./_components/Header";
import ReminderEmailContent from "./_components/ReminderEmailContent";

type Props = {
  children?: React.ReactNode;
  hoursLeft: number;
  userFirstName: string;
  week: number;
};

const PickReminderEmail: Email<Props> = ({ browserLink, hoursLeft, userFirstName, week, unsubscribeLink }) => {
  const { domain } = env;
  const preview = "Don't fall out of survivor this week, act now to submit your survivor pick!";

  return (
    <Html>
      <BodyWrapper title={getSubject(userFirstName)}>
        <Preview>{preview}</Preview>
        <Container className="max-w-[600px] md:max-w-[800px]">
          <Header browserLink={browserLink} />

          <ReminderEmailContent
            actionHref={`${domain}/survivor/set`}
            actionLabel="Make Survivor Pick"
            message={
              <React.Fragment>
                This is your friendly reminder that you have not submitted your survivor pick yet for week {week} and
                you now have less than {hoursLeft} hours.
                <br />
                <br />
                Click the button below to make your pick.
              </React.Fragment>
            }
            userFirstName={userFirstName}
          />

          <Footer unsubscribeLink={unsubscribeLink} />
        </Container>
      </BodyWrapper>
    </Html>
  );
};

PickReminderEmail.PreviewProps = {
  browserLink: "https://example.com",
  hoursLeft: 2,
  unsubscribeLink: "https://example.com/unsubscribe",
  userFirstName: "John",
  week: 1,
};

export default PickReminderEmail;

export const getSubject = (firstName: string) => `Hurry up, ${firstName}!`;

export const getHtml = (props: Parameters<Email<Props>>[0]) => render(<PickReminderEmail {...props} />);

export const getPlainText = (props: Parameters<Email<Props>>[0]) =>
  render(<PickReminderEmail {...props} />, {
    plainText: true,
  });
