import { Button, Column, Container, Head, Html, Preview, Row, Section, Text } from "@react-email/components";
import { render } from "@react-email/render";
// biome-ignore lint/style/useImportType: This is needed for react-email
import * as React from "react";

import { env } from "../../src/env";
import type { Email } from "../../src/types";
import BodyWrapper from "./_components/BodyWrapper";
import Footer from "./_components/Footer";
import Header from "./_components/Header";

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
      <Head>
        <title>{getSubject(userFirstName)}</title>
      </Head>
      <BodyWrapper>
        <Preview>{preview}</Preview>
        <Container>
          <Header browserLink={browserLink} />

          <Section>
            <Row>
              <Column className="bg-white pt-8 px-6 pb-4 rounded-b-xl">
                <Text className="text-lg">
                  Hello forgetful {userFirstName},
                  <br />
                  <br />
                  This is your friendly reminder that you have not submitted your survivor pick yet for week {week} and
                  you now have less than {hoursLeft} hours.
                  <br />
                  <br />
                  Click the button below to make your pick.
                  <br />
                  <br />
                  Good luck!
                </Text>
                <Button
                  className="bg-green-700 text-white w-full text-center py-2.5 rounded-md"
                  href={`${domain}/survivor/set`}
                >
                  Make Survivor Pick
                </Button>
              </Column>
            </Row>
          </Section>

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
