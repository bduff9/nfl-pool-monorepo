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
  const preview = "Don't lose out on points this week, act now to submit your picks!";

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
                  This is your friendly reminder that you have not submitted your picks yet for week {week} of the NFL
                  confidence pool and you now have less than {hoursLeft} hours.
                  <br />
                  <br />
                  Click the button below to make your picks.
                  <br />
                  <br />
                  Good luck!
                </Text>
                <Button
                  className="bg-green-700 text-white w-full text-center py-2.5 rounded-md"
                  href={`${domain}/picks/set`}
                >
                  Make Picks
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
