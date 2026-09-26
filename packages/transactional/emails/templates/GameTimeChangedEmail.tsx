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
  newKickoffLabel: string;
  oldKickoffLabel: string;
  userFirstName: string;
  visitorTeamName: string;
  week: number;
};

const GameTimeChangedEmail: Email<Props> = ({
  browserLink,
  homeTeamName,
  newKickoffLabel,
  oldKickoffLabel,
  unsubscribeLink,
  userFirstName,
  visitorTeamName,
  week,
}) => {
  const { domain } = env;
  const preview = "This is an automated email to let you know the kickoff time of a game you have picks for changed";

  return (
    <Html>
      <BodyWrapper title={getSubject({ homeTeamName, visitorTeamName })}>
        <Preview>{preview}</Preview>
        <Container className="max-w-[600px] md:max-w-[800px]">
          <EmailBodySection browserLink={browserLink}>
            <Text className="text-xl">Hello {userFirstName},</Text>

            <Text className="text-lg">
              The kickoff time for the week {week} game{" "}
              <span className="font-semibold">
                {visitorTeamName} @ {homeTeamName}
              </span>{" "}
              has changed:
              <br />
              Was: {oldKickoffLabel}
              <br />
              Now: {newKickoffLabel}
            </Text>

            <Text className="text-base">
              Your picks for this game are unaffected, but make sure you&apos;re around before the new kickoff!
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

GameTimeChangedEmail.PreviewProps = {
  browserLink: "https://asitewithnoname.com",
  homeTeamName: "Seattle Seahawks",
  newKickoffLabel: "Sun, Sep 27, 4:15 PM ET",
  oldKickoffLabel: "Sun, Sep 27, 1:00 PM ET",
  unsubscribeLink: "https://asitewithnoname.com",
  userFirstName: "John",
  visitorTeamName: "New England Patriots",
  week: 4,
};

export const getSubject = ({
  homeTeamName,
  visitorTeamName,
}: {
  homeTeamName: string;
  visitorTeamName: string;
}): string => `Game time changed: ${visitorTeamName} @ ${homeTeamName}`;

export const getHtml = (props: Parameters<Email<Props>>[0]): Promise<string> =>
  render(<GameTimeChangedEmail {...props} />);

export const getPlainText = (props: Parameters<Email<Props>>[0]): Promise<string> =>
  render(<GameTimeChangedEmail {...props} />, {
    plainText: true,
  });

export default GameTimeChangedEmail;
