import { Button, Column, Container, Head, Html, Preview, Row, Section, Text } from "@react-email/components";
import { render } from "@react-email/render";
// biome-ignore lint/style/useImportType: This is needed for react-email
import * as React from "react";

import { env } from "../../src/env";
import type { Email } from "../../src/types";
import { relativeTime } from "../../src/util";
import BodyWrapper from "./_components/BodyWrapper";
import Footer from "./_components/Footer";
import Header from "./_components/Header";

type Props = {
  balance: number;
  children?: React.ReactNode;
  nextKickoff: Date;
  nextWeek: number;
  paymentDueDate: Date;
  userFirstName: string;
};

const LockedOutEmail: Email<Props> = ({
  balance,
  browserLink,
  nextKickoff,
  nextWeek,
  paymentDueDate,
  userFirstName,
  unsubscribeLink,
}) => {
  const { domain } = env;
  const preview = "Please pay your fees ASAP to avoid missing out on any points";

  return (
    <Html>
      <Head>
        <title>{getSubject()}</title>
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
                  Your payment of ${balance} was due by the end of {paymentDueDate.toLocaleDateString()} and is now
                  late. As such, your account has been temporarily disabled. Please either pay ASAP using the payment
                  info at the bottom of this email or let me know if you would like to drop out this season so we can
                  update the data accordingly.
                  <br />
                  <br />
                  Week {nextWeek} begins {relativeTime(nextKickoff)} so don't delay in sending your payment to avoid
                  missing out on any points! Once your payment has been sent, please allow for up to 24 hours for us to
                  receive it and enable your account.
                </Text>
                <small>
                  Note: If you are receiving this email in error, please reach out to an admin immediately to ensure
                  your account gets re-enabled.
                </small>

                <p className="font-bold text-xl mt-6 mb-0">Payment Info</p>

                <dl>
                  <dt className="font-semibold">Paypal:</dt>
                  <dd>
                    Pay using link{" "}
                    <a href={`https://www.paypal.me/brianduffey/{balance}`} rel="noopener noreferrer" target="_blank">
                      paypal.me/brianduffey/{balance}
                    </a>
                  </dd>
                  <dt className="font-semibold">Venmo:</dt>
                  <dd>Pay ${balance} to account @brianduffey</dd>
                  <dt className="font-semibold">Zelle:</dt>
                  <dd>Pay ${balance} using your bank&apos;s Zelle service to account bduff9@gmail.com</dd>
                </dl>

                <br />

                <Text className="text-lg">
                  Please do not hesitate to let us know if there are any questions or concerns,
                  <br />
                  Brian &amp; Billy
                </Text>
                <Button
                  className="bg-green-700 text-white w-full text-center py-2.5 rounded-md"
                  href={`${domain}/support`}
                >
                  View Help section for more information
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

LockedOutEmail.PreviewProps = {
  balance: 45,
  browserLink: "https://example.com",
  nextKickoff: new Date(),
  nextWeek: 4,
  paymentDueDate: new Date(),
  unsubscribeLink: "https://example.com/unsubscribe",
  userFirstName: "John",
};

export default LockedOutEmail;

export const getSubject = () => `Your payment is now past due!`;

export const getHtml = (props: Parameters<Email<Props>>[0]) => render(<LockedOutEmail {...props} />);

export const getPlainText = (props: Parameters<Email<Props>>[0]) =>
  render(<LockedOutEmail {...props} />, {
    plainText: true,
  });
