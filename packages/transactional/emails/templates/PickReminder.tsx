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
  const preview = "Don't lose out on points this week, act now to submit your picks!";

  return (
    <Html>
      <BodyWrapper title={getSubject(userFirstName)}>
        <Preview>{preview}</Preview>
        <Container className="max-w-[600px] md:max-w-[800px]">
          <Header browserLink={browserLink} />

          <ReminderEmailContent
            actionHref={`${domain}/picks/set`}
            actionLabel="Make Picks"
            message={
              <React.Fragment>
                This is your friendly reminder that you have not submitted your picks yet for week {week} of the NFL
                confidence pool and you now have less than {hoursLeft} hours.
                <br />
                <br />
                Click the button below to make your picks.
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
