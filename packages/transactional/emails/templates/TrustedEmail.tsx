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
  paymentDueDate: Date;
  userFirstName: string;
  year: number;
};

const TrustedEmail: Email<Props> = ({ browserLink, paymentDueDate, userFirstName, year, unsubscribeLink }) => {
  const { domain } = env;
  const preview =
    "This is an automated notification to let you know that an admin has approved your registration for this season";

  return (
    <Html>
      <Head>
        <title>{getSubject(year)}</title>
      </Head>
      <BodyWrapper>
        <Preview>{preview}</Preview>
        <Container>
          <Header browserLink={browserLink} />

          <Section>
            <Row>
              <Column className="bg-white pt-8 px-6 pb-4 rounded-b-xl">
                <Text className="text-lg">
                  Hello {userFirstName},
                  <br />
                  <br />
                  This is a notification that your request to register for the {year} NFL Confidence Pool has just been
                  approved by an admin.
                  <br />
                  <br />
                  You can now log in and start making your picks.
                  <br />
                  <br />
                  Please be sure to pay your entry fees by {paymentDueDate.toDateString()}.
                  <br />
                  <br />
                  You can reply to this email if you have any questions, and the pool can be accessed at the link below.
                  <br />
                  <br />
                  Best of luck to you!
                </Text>
                <Button className="bg-green-700 text-white w-full text-center py-2.5 rounded-md" href={`${domain}/`}>
                  Visit the Pool
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

TrustedEmail.PreviewProps = {
  browserLink: "https://example.com",
  paymentDueDate: new Date(),
  unsubscribeLink: "https://example.com/unsubscribe",
  userFirstName: "John",
  year: 2025,
};

export default TrustedEmail;

export const getSubject = (year: number) => `You have been approved for the ${year} season!`;

export const getHtml = (props: Parameters<Email<Props>>[0]) => render(<TrustedEmail {...props} />);

export const getPlainText = (props: Parameters<Email<Props>>[0]) =>
  render(<TrustedEmail {...props} />, {
    plainText: true,
  });
