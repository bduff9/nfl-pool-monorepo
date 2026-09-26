import { render } from "@react-email/render";
// biome-ignore lint/style/useImportType: This is needed for react-email
import * as React from "react";
import { Button, Container, Html, Preview, Text } from "react-email";

import { env } from "../../src/env";
import type { Email } from "../../src/types";
import BodyWrapper from "./_components/BodyWrapper";
import EmailBodySection from "./_components/EmailBodySection";
import Footer from "./_components/Footer";

type Props = {
  children?: React.ReactNode;
  homeTeamName: string;
  pickedTeamName?: string;
  pickPoints: number;
  userFirstName: string;
  visitorTeamName: string;
  week: number;
};

const PicksAutoSubmittedEmail: Email<Props> = ({
  browserLink,
  homeTeamName,
  pickedTeamName,
  pickPoints,
  unsubscribeLink,
  userFirstName,
  visitorTeamName,
  week,
}) => {
  const { domain } = env;
  const preview = "This is an automated notification about your picks for this week being submitted for you";
  const game = `${visitorTeamName} @ ${homeTeamName}`;
  const detail = pickedTeamName
    ? `We auto-picked your ${pickedTeamName} with ${pickPoints} points.`
    : `We auto-assigned ${pickPoints} points to it. Your pick was left without a team, so it will score as a miss.`;

  return (
    <Html>
      <BodyWrapper title={getSubject(week)}>
        <Preview>{preview}</Preview>
        <Container className="max-w-[600px] md:max-w-[800px]">
          <EmailBodySection browserLink={browserLink}>
            <Text className="text-xl">Hello {userFirstName},</Text>

            <Text className="text-lg">
              You hadn&apos;t set a pick for the week {week} game <span className="font-semibold">{game}</span> before
              it started, so we submitted one for you.
              <br />
              {detail}
            </Text>

            <Button className="bg-green-700 text-white w-full text-center py-2.5 rounded-md" href={`${domain}`}>
              Go to the pool
            </Button>
          </EmailBodySection>

          <Footer unsubscribeLink={unsubscribeLink} />
        </Container>
      </BodyWrapper>
    </Html>
  );
};

PicksAutoSubmittedEmail.PreviewProps = {
  browserLink: "https://asitewithnoname.com",
  homeTeamName: "Seattle Seahawks",
  pickPoints: 3,
  unsubscribeLink: "https://asitewithnoname.com",
  userFirstName: "John",
  visitorTeamName: "New England Patriots",
  week: 4,
};

export const getSubject = (week: number): string => `Your week ${week} picks were submitted for you`;

export const getHtml = (props: Parameters<Email<Props>>[0]): Promise<string> =>
  render(<PicksAutoSubmittedEmail {...props} />);

export const getPlainText = (props: Parameters<Email<Props>>[0]): Promise<string> =>
  render(<PicksAutoSubmittedEmail {...props} />, {
    plainText: true,
  });

export default PicksAutoSubmittedEmail;
