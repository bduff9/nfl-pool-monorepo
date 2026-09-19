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
  homeTeam: {
    TeamID: number;
    TeamCity: string;
    TeamName: string;
    TeamPrimaryColor: string;
    TeamSecondaryColor: string;
  };
  hoursLeft: number;
  userFirstName: string;
  userId: number;
  visitorTeam: {
    TeamID: number;
    TeamCity: string;
    TeamName: string;
    TeamPrimaryColor: string;
    TeamSecondaryColor: string;
  };
  week: number;
};

const emptyTeam = { TeamCity: "", TeamID: 0, TeamName: "", TeamPrimaryColor: "", TeamSecondaryColor: "" };

const QuickPickEmail: Email<Props> = ({
  browserLink,
  homeTeam = emptyTeam,
  hoursLeft,
  unsubscribeLink,
  userFirstName,
  userId,
  visitorTeam = emptyTeam,
  week,
}) => {
  const { domain } = env;
  const preview =
    "This is an automated email to allow you one-click access to make your pick for the first game of the week";

  return (
    <Html>
      <BodyWrapper title={getSubject(userFirstName)}>
        <Preview>{preview}</Preview>
        <Container className="max-w-[600px] md:max-w-[800px]">
          <EmailBodySection browserLink={browserLink}>
            <Text className="text-xl">Quick {userFirstName}!</Text>

            <Text className="text-lg">
              You have not made your pick for game 1 of week {week} yet and you now have less than {hoursLeft} hours.
            </Text>

            <Text className="text-lg">
              You can avoid losing points for this game by simply clicking one of the teams below to set your pick.
            </Text>

            <Text>
              <strong>Note:</strong> This email is only good up until kickoff of this game, so act now to avoid losing
              points for this week!
            </Text>

            <div className="flex">
              <Button
                className="w-full text-center py-2.5 rounded-md"
                href={`${domain}/quick-pick/${userId}/${visitorTeam.TeamID}`}
                style={{
                  backgroundColor: visitorTeam.TeamPrimaryColor,
                  border: `1px solid ${visitorTeam.TeamSecondaryColor}`,
                  color: visitorTeam.TeamSecondaryColor,
                }}
              >
                {visitorTeam.TeamCity} {visitorTeam.TeamName}
              </Button>

              <div className="text-lg flex items-center">@</div>

              <Button
                className="w-full text-center py-2.5 rounded-md"
                href={`${domain}/quick-pick/${userId}/${homeTeam.TeamID}`}
                style={{
                  backgroundColor: homeTeam.TeamPrimaryColor,
                  border: `1px solid ${homeTeam.TeamSecondaryColor}`,
                  color: homeTeam.TeamSecondaryColor,
                }}
              >
                {homeTeam.TeamCity} {homeTeam.TeamName}
              </Button>
            </div>
          </EmailBodySection>

          <Footer unsubscribeLink={unsubscribeLink} />
        </Container>
      </BodyWrapper>
    </Html>
  );
};

QuickPickEmail.PreviewProps = {
  browserLink: "https://example.com",
  homeTeam: {
    TeamCity: "Chicago",
    TeamID: 1,
    TeamName: "Bears",
    TeamPrimaryColor: "#061E3E",
    TeamSecondaryColor: "#DF6108",
  },
  hoursLeft: 3,
  unsubscribeLink: "https://example.com/unsubscribe",
  userFirstName: "John",
  userId: 1,
  visitorTeam: {
    TeamCity: "New York",
    TeamID: 2,
    TeamName: "Giants",
    TeamPrimaryColor: "#03497F",
    TeamSecondaryColor: "#FFFFFF",
  },
  week: 1,
};

export default QuickPickEmail;

export const getSubject = (userFirstName: string) => `Time's almost up, ${userFirstName}!`;

export const getHtml = (props: Parameters<Email<Props>>[0]) => render(<QuickPickEmail {...props} />);

export const getPlainText = (props: Parameters<Email<Props>>[0]) =>
  render(<QuickPickEmail {...props} />, {
    plainText: true,
  });
