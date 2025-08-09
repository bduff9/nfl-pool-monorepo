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
  overall1stPrize: number;
  overall2ndPrize: number;
  overall3rdPrize: number;
  overallLastPrize: number;
  survivor1stPrize: number;
  survivor2ndPrize: number;
  userFirstName: string;
  weekly1stPrize: number;
  weekly2ndPrize: number;
};

const PrizesSetEmail: Email<Props> = ({
  browserLink,
  overall1stPrize,
  overall2ndPrize,
  overall3rdPrize,
  overallLastPrize,
  survivor1stPrize,
  survivor2ndPrize,
  unsubscribeLink,
  userFirstName,
  weekly1stPrize,
  weekly2ndPrize,
}) => {
  const { domain } = env;
  const preview =
    "This is an automated notification to let you know that the prizes for this season have now been locked in";

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
                <Text className="text-xl">Hi {userFirstName},</Text>

                <Text className="text-lg">
                  This is a notification that everyone has now paid and so the payouts for this season have now been
                  set.
                </Text>

                <Text className="underline text-lg">Weekly Payouts</Text>
                <ul className="mt-0.5 list-none pl-0">
                  <li>1st place - ${weekly1stPrize}</li>
                  <li>2nd place - ${weekly2ndPrize}</li>
                </ul>

                <Text className="underline text-lg">Overall Payouts</Text>
                <ul className="mt-0.5 list-none pl-0">
                  <li>1st place - ${overall1stPrize}</li>
                  <li>2nd place - ${overall2ndPrize}</li>
                  <li>3rd place - ${overall3rdPrize}</li>
                  <li>
                    Last place<span className="text-red-500">*</span> - ${overallLastPrize}
                  </li>
                </ul>
                <Text className="text-red-500">
                  * - Must not miss picking any games from this point forward to be eligible for the last place prize
                </Text>

                <Text className="underline text-lg">Survivor Payouts</Text>
                <ul className="mt-0.5 list-none pl-0">
                  <li>1st place - ${survivor1stPrize}</li>
                  <li>2nd place - ${survivor2ndPrize}</li>
                </ul>

                <Text className="text-lg">
                  Reminder that all payouts will be done after the season has completed. Any questions or concerns
                  please let us know!
                </Text>

                <Text className="text-lg">You can view all current prizes you've won at the link below.</Text>

                <Button
                  className="bg-green-700 text-white w-full text-center py-2.5 rounded-md"
                  href={`${domain}/users/payments`}
                >
                  View my Prizes
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

PrizesSetEmail.PreviewProps = {
  browserLink: "https://example.com",
  overall1stPrize: 250,
  overall2ndPrize: 150,
  overall3rdPrize: 100,
  overallLastPrize: 40,
  survivor1stPrize: 100,
  survivor2ndPrize: 50,
  unsubscribeLink: "https://example.com/unsubscribe",
  userFirstName: "John",
  weekly1stPrize: 25,
  weekly2ndPrize: 15,
};

export default PrizesSetEmail;

export const getSubject = () => "Prizes have officially been set!";

export const getHtml = (props: Parameters<Email<Props>>[0]) => render(<PrizesSetEmail {...props} />);

export const getPlainText = (props: Parameters<Email<Props>>[0]) =>
  render(<PrizesSetEmail {...props} />, {
    plainText: true,
  });
