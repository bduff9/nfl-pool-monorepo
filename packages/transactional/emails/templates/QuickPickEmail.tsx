import { Button, Column, Container, Head, Html, Preview, render, Row, Section, Text } from "@react-email/components";
import React from "react";
import { env } from "../../src/env";
import type { Email } from "../../src/types";
import BodyWrapper from "./_components/BodyWrapper";
import Footer from "./_components/Footer";
import Header from "./_components/Header";

type Props = {
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

const QuickPickEmail: Email<Props> = ({
  browserLink,
  homeTeam,
  hoursLeft,
  unsubscribeLink,
  userFirstName,
  userId,
  visitorTeam,
  week,
}) => {
  const { domain } = env;
  const preview = "This is an automated email to allow you one-click access to make your pick for the first game of the week";

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
                <Text className="text-xl">
                  Quick {userFirstName}!
                </Text>

                <Text className="text-lg">You have not made your pick for game 1 of week {week} yet and you now have less than {hoursLeft} hours.</Text>

                <Text className="text-lg">You can avoid losing points for this game by simply clicking one of the teams below to set your pick.</Text>

                <Text><strong>Note:</strong> This email is only good up until kickoff of this game, so act now to avoid losing points for this week!</Text>

                <div className="flex">
                <Button
                  className="w-full text-center py-2.5 rounded-md"
                  href={`${domain}/quick-pick/${userId}/${visitorTeam.TeamID}`}
                  style={{
                    backgroundColor: visitorTeam.TeamPrimaryColor,
                    border: `1px solid ${visitorTeam.TeamSecondaryColor}`,
                    color: visitorTeam.TeamSecondaryColor
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
                    color: homeTeam.TeamSecondaryColor
                  }}
                >
                  {homeTeam.TeamCity} {homeTeam.TeamName}
                </Button>
                </div>
              </Column>
            </Row>
          </Section>

          <Footer unsubscribeLink={unsubscribeLink} />
        </Container>
      </BodyWrapper>
    </Html>
  );
};

QuickPickEmail.PreviewProps = {
  browserLink: "https://example.com",
  homeTeam: {
    TeamID: 1,
    TeamCity: "Chicago",
    TeamName: "Bears",
    TeamPrimaryColor: "#061E3E",
    TeamSecondaryColor: "#DF6108",
  },
  hoursLeft: 3,
  userFirstName: "John",
  userId: 1,
  visitorTeam: {
    TeamID: 2,
    TeamCity: "New York",
    TeamName: "Giants",
    TeamPrimaryColor: "#03497F",
    TeamSecondaryColor: "#FFFFFF",
  },
  week: 1,
  unsubscribeLink: "https://example.com/unsubscribe",
};

export default QuickPickEmail;

export const getSubject = (userFirstName: string) => `Time's almost up, ${userFirstName}!`;

export const getHtml = (props: Parameters<Email<Props>>[0]) => render(<QuickPickEmail {...props} />);

export const getPlainText = (props: Parameters<Email<Props>>[0]) =>
  render(<QuickPickEmail {...props} />, {
    plainText: true,
  });
