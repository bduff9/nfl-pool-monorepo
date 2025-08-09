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
  isFinal?: boolean;
  payByDate: string;
  poolCost: number;
  poolYear: number;
  survivorCost: number;
  userFirstName: string;
};

const InterestEmail: Email<Props> = ({
  browserLink,
  isFinal = false,
  payByDate,
  poolCost,
  poolYear,
  survivorCost,
  unsubscribeLink,
  userFirstName,
}) => {
  const { domain } = env;
  const preview = `The ${poolYear} confidence pool is open and ready for registration!`;

  return (
    <Html>
      <Head>
        <title>{getSubject(poolYear, isFinal)}</title>
      </Head>
      <BodyWrapper>
        <Preview>{preview}</Preview>
        <Container>
          <Header browserLink={browserLink} />

          <Section>
            <Row>
              <Column className="bg-white pt-8 px-6 pb-4 rounded-b-xl">
                <Text className="text-lg">Hello {userFirstName},</Text>

                {isFinal && (
                  <h3 className="underline scroll-m-20 text-2xl font-semibold tracking-tight">
                    This is your final reminder to register and play! The first game of the season kicks off in just
                    days!
                  </h3>
                )}

                <Text className="text-lg">
                  You are getting this email because you either indicated an interest in participating in the {poolYear}{" "}
                  confidence pool or we thought you would be interested. All players are welcome, so even if you are not
                  interested, please feel free to forward this along appropriately.
                </Text>

                <Text className="text-lg">
                  For those of you who have never done a confidence pool before, they are very easy to do. The objective
                  is to pick the winner of each game for the current week. When making your selections, you will assign
                  a point value, or "confidence" value, based on how sure you are of each pick. 1 means it could go
                  either way and 16 means it's a sure thing. If you are right, you win that amount of points and the
                  player with the highest point total wins. Payouts are done to the winner(s) each week and top 3 places
                  at the end for the overall score. More details and rules about the confidence pool can be found here:
                </Text>

                <Text className="text-lg">
                  <a href={`${domain}/support`}>Support Page</a>
                </Text>

                <Text className="text-xl font-bold mt-6">Registering</Text>

                <Text className="text-lg">
                  If you have played previously, you can click the button at the bottom of this email and sign in to
                  complete registration for this upcoming season.
                </Text>

                <Text className="text-lg">
                  If you are a new player, welcome! You will also need to click the button below, however, you will need
                  to complete initial registration. You have the option of registering with an email and password, or
                  with a Twitter or Google account. You also have the option of registering with email and then linking
                  your Twitter and/or Google account, allowing you one-click sign-ins with all three methods. This is
                  what we recommend, though certainly not required.
                </Text>

                <Text className="text-lg">
                  Once you are fully registered, you will be able to sign in and start making picks. The pool contains
                  full information on how to make your picks and play, however, if you have any questions, please do not
                  hesitate to contact us at this email address.
                </Text>

                <Text className="text-xl font-bold mt-6">Survivor Pool</Text>

                <Text className="text-lg">
                  There is also an optional mini-game survivor pool. If you've never taken part in such a pool, it
                  involves picking one team each week that you think will win. If your team wins in Week 1, you move on
                  to make a pick in Week 2. If your team wins in Week 2, you can make a pick in Week 3, and so on. The
                  catch is that you cannot pick the same team twice. You could use a heavy favorite in Week 1, but you
                  would not have access to them later in the year if you're alive in the closing weeks. If you pick a
                  team that loses, you are out of the pool for the remainder of the season.
                </Text>

                <Text className="text-xl font-bold mt-6">Entry Fees and Payouts</Text>

                <Text className="text-lg">
                  The cost for this confidence pool is ${poolCost} per person for the whole season. The survivor pool
                  mini game is ${survivorCost} for the whole season which you can sign up for during or after
                  registration. Please pay your total entry fee by the end of the third week of the season (before the
                  end of {payByDate}). Payouts will be announced after that and will be based on how many people sign
                  up. The more people who participate the better, as the payouts will be higher, so invite anyone who
                  you think may be interested. New players will be accepted up until the start of the third week and
                  will be assigned the number of points from the lowest score for the previous weeks.
                </Text>

                <Text className="text-lg">
                  Please do not hesitate to let us know if there are any questions or concerns,
                  <br />
                  Brian and Billy
                </Text>

                <Button className="bg-green-700 text-white w-full text-center py-2.5 rounded-md" href={`${domain}/`}>
                  Register Here
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

InterestEmail.PreviewProps = {
  browserLink: "https://example.com",
  isFinal: false,
  payByDate: "Mon, September 30, 2025",
  poolCost: 40,
  poolYear: 2025,
  survivorCost: 5,
  unsubscribeLink: "https://example.com/unsubscribe",
  userFirstName: "John",
};

export default InterestEmail;

export const getSubject = (poolYear: number, isFinal = false) => {
  if (isFinal) {
    return `Last reminder to register for the ${poolYear} Confidence Pool!`;
  }

  return `${poolYear} Confidence Pool is now open for registration`;
};

export const getHtml = (props: Parameters<Email<Props>>[0]) => render(<InterestEmail {...props} />);

export const getPlainText = (props: Parameters<Email<Props>>[0]) =>
  render(<InterestEmail {...props} />, {
    plainText: true,
  });
