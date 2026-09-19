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
  picks: { PickPoints: number | null; TeamID: number | null; TeamCity: string | null; TeamName: string | null }[];
  tiebreakerLastScore: number;
  userFirstName: string;
  week: number;
};

const PicksSubmittedEmail: Email<Props> = ({
  browserLink,
  picks = [],
  tiebreakerLastScore,
  userFirstName,
  week,
  unsubscribeLink,
}) => {
  const { domain } = env;
  const preview =
    "This is an automated notification to let you know that we have successfully received your picks for this week";

  return (
    <Html>
      <BodyWrapper title={getSubject(week)}>
        <Preview>{preview}</Preview>
        <Container className="max-w-[600px] md:max-w-[800px]">
          <EmailBodySection browserLink={browserLink}>
            <Text className="text-lg">
              Hello {userFirstName},
              <br />
              <br />
              This is a confirmation that your week {week} picks have been submitted.
              <br />
              <br />
              Your picks are:
            </Text>
            <ul className="mt-0.5 text-sm list-none pl-0">
              {picks.map((pick) => (
                <li className="text-base" key={pick.PickPoints}>
                  {pick.PickPoints} - {pick.TeamID ? `${pick.TeamCity} ${pick.TeamName}` : "Missed Pick"}
                </li>
              ))}
            </ul>
            <Text className="text-lg">Tiebreaker Score: {tiebreakerLastScore}</Text>
            <Text className="text-lg">You can also use the link below to view everyone's submitted picks:</Text>
            <Button
              className="bg-green-700 text-white w-full text-center py-2.5 rounded-md"
              href={`${domain}/picks/viewall`}
            >
              View All Picks
            </Button>
          </EmailBodySection>

          <Footer unsubscribeLink={unsubscribeLink} />
        </Container>
      </BodyWrapper>
    </Html>
  );
};

PicksSubmittedEmail.PreviewProps = {
  browserLink: "https://example.com",
  picks: [
    { PickPoints: 1, TeamCity: "Example", TeamID: 1, TeamName: "Team" },
    { PickPoints: 2, TeamCity: null, TeamID: null, TeamName: null },
    { PickPoints: 3, TeamCity: "Example", TeamID: 3, TeamName: "Team" },
  ],
  tiebreakerLastScore: 33,
  unsubscribeLink: "https://example.com/unsubscribe",
  userFirstName: "John",
  week: 1,
};

export default PicksSubmittedEmail;

export const getSubject = (week: number) => `Your week ${week} picks have been submitted`;

export const getHtml = (props: Parameters<Email<Props>>[0]) => render(<PicksSubmittedEmail {...props} />);

export const getPlainText = (props: Parameters<Email<Props>>[0]) =>
  render(<PicksSubmittedEmail {...props} />, {
    plainText: true,
  });
