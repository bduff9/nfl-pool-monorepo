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
  homeTeam: {
    TeamCity: string;
    TeamName: string;
    TeamPrimaryColor: string;
    TeamSecondaryColor: string;
  };
  loserScore: number;
  userFirstName: string;
  visitorTeam: {
    TeamCity: string;
    TeamName: string;
    TeamPrimaryColor: string;
    TeamSecondaryColor: string;
  };
  week: number;
  winnerScore: number;
  winnerTeam: {
    TeamCity: string;
    TeamName: string;
    TeamPrimaryColor: string;
    TeamSecondaryColor: string;
  };
};

const WeekEndedEmail: Email<Props> = ({
  browserLink,
  homeTeam,
  loserScore,
  unsubscribeLink,
  userFirstName,
  visitorTeam,
  week,
  winnerScore,
  winnerTeam,
}) => {
  const { domain } = env;
  const preview = "This is an automated email you requested to let you know when the week ends";

  return (
    <Html>
      <Head>
        <title>{getSubject(week)}</title>
      </Head>
      <BodyWrapper>
        <Preview>{preview}</Preview>
        <Container>
          <Header browserLink={browserLink} />

          <Section>
            <Row>
              <Column className="bg-white pt-8 px-6 pb-4 rounded-b-xl">
                <Text className="text-xl">Hello {userFirstName},</Text>

                <Text className="text-lg">
                  Week {week} has just ended with:
                  <br />
                  <span
                    className="px-1.5"
                    style={{ backgroundColor: visitorTeam.TeamPrimaryColor, color: visitorTeam.TeamSecondaryColor }}
                  >
                    {visitorTeam.TeamCity} {visitorTeam.TeamName}
                  </span>
                  @
                  <span
                    className="px-1.5"
                    style={{ backgroundColor: homeTeam.TeamPrimaryColor, color: homeTeam.TeamSecondaryColor }}
                  >
                    {homeTeam.TeamCity} {homeTeam.TeamName}
                  </span>
                </Text>

                <Text className="text-lg">
                  {winnerScore === loserScore ? (
                    `The game ended in a tie, ${winnerScore} - ${loserScore}`
                  ) : (
                    <>
                      The{" "}
                      <span
                        className="px-1.5"
                        style={{ backgroundColor: winnerTeam.TeamPrimaryColor, color: winnerTeam.TeamSecondaryColor }}
                      >
                        {winnerTeam.TeamCity} {winnerTeam.TeamName}
                      </span>{" "}
                      won with a score of <strong>{winnerScore}</strong> - {loserScore}
                    </>
                  )}
                </Text>

                <Button className="bg-green-700 text-white w-full text-center py-2.5 rounded-md" href={`${domain}`}>
                  View week results
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

WeekEndedEmail.PreviewProps = {
  browserLink: "https://example.com",
  homeTeam: {
    TeamCity: "Chicago",
    TeamName: "Bears",
    TeamPrimaryColor: "#061E3E",
    TeamSecondaryColor: "#DF6108",
  },
  loserScore: 7,
  unsubscribeLink: "https://example.com/unsubscribe",
  userFirstName: "John",
  visitorTeam: {
    TeamCity: "New York",
    TeamName: "Giants",
    TeamPrimaryColor: "#03497F",
    TeamSecondaryColor: "#FFFFFF",
  },
  week: 1,
  winnerScore: 14,
  winnerTeam: {
    TeamCity: "Chicago",
    TeamName: "Bears",
    TeamPrimaryColor: "#061E3E",
    TeamSecondaryColor: "#DF6108",
  },
};

export default WeekEndedEmail;

export const getSubject = (week: number) => `Week ${week} has just finished`;

export const getHtml = (props: Parameters<Email<Props>>[0]) => render(<WeekEndedEmail {...props} />);

export const getPlainText = (props: Parameters<Email<Props>>[0]) =>
  render(<WeekEndedEmail {...props} />, {
    plainText: true,
  });
