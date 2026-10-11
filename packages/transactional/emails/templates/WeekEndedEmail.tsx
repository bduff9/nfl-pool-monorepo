import { render } from "@react-email/render";
// biome-ignore lint/style/useImportType: This is needed for react-email
import * as React from "react";
import { Button, Container, Html, Preview, Text } from "react-email";

import { env } from "../../src/env";
import type { Email } from "../../src/types";
import BodyWrapper from "./_components/BodyWrapper";
import EmailBodySection from "./_components/EmailBodySection";
import Footer from "./_components/Footer";
import type { TeamColors } from "./_components/TeamBadge";
import WeekMatchupIntro from "./_components/WeekMatchupIntro";

type Props = {
  children?: React.ReactNode;
  homeTeam: TeamColors;
  loserScore: number;
  userFirstName: string;
  visitorTeam: TeamColors;
  week: number;
  winnerScore: number;
  winnerTeam: TeamColors;
};

const emptyTeam = { TeamCity: "", TeamName: "", TeamPrimaryColor: "", TeamSecondaryColor: "" };

const WeekEndedEmail: Email<Props> = ({
  browserLink,
  homeTeam = emptyTeam,
  loserScore,
  unsubscribeLink,
  userFirstName,
  visitorTeam = emptyTeam,
  week,
  winnerScore,
  winnerTeam = emptyTeam,
}) => {
  const { domain } = env;
  const preview = "This is an automated email you requested to let you know when the week ends";

  return (
    <Html>
      <BodyWrapper title={getSubject(week)}>
        <Preview>{preview}</Preview>
        <Container className="max-w-[600px] md:max-w-[800px]">
          <EmailBodySection browserLink={browserLink}>
            <WeekMatchupIntro
              homeTeam={homeTeam}
              status="ended"
              userFirstName={userFirstName}
              visitorTeam={visitorTeam}
              week={week}
            />

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
          </EmailBodySection>

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
