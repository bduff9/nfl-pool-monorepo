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
    TeamCity: string;
    TeamName: string;
    TeamPrimaryColor: string;
    TeamSecondaryColor: string;
  };
  userFirstName: string;
  visitorTeam: {
    TeamCity: string;
    TeamName: string;
    TeamPrimaryColor: string;
    TeamSecondaryColor: string;
  };
  week: number;
};

const emptyTeam = { TeamCity: "", TeamName: "", TeamPrimaryColor: "", TeamSecondaryColor: "" };

const WeekStartedEmail: Email<Props> = ({
  browserLink,
  homeTeam = emptyTeam,
  unsubscribeLink,
  userFirstName,
  visitorTeam = emptyTeam,
  week,
}) => {
  const { domain } = env;
  const preview = "This is an automated email you requested to let you know when the week starts";

  return (
    <Html>
      <BodyWrapper title={getSubject(week)}>
        <Preview>{preview}</Preview>
        <Container className="max-w-[600px] md:max-w-[800px]">
          <EmailBodySection browserLink={browserLink}>
            <Text className="text-xl">Hello {userFirstName},</Text>

            <Text className="text-lg">
              Week {week} has just started with:
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

WeekStartedEmail.PreviewProps = {
  browserLink: "https://example.com",
  homeTeam: {
    TeamCity: "Chicago",
    TeamName: "Bears",
    TeamPrimaryColor: "#061E3E",
    TeamSecondaryColor: "#DF6108",
  },
  unsubscribeLink: "https://example.com/unsubscribe",
  userFirstName: "John",
  visitorTeam: {
    TeamCity: "New York",
    TeamName: "Giants",
    TeamPrimaryColor: "#03497F",
    TeamSecondaryColor: "#FFFFFF",
  },
  week: 1,
};

export default WeekStartedEmail;

export const getSubject = (week: number) => `Week ${week} has just begun`;

export const getHtml = (props: Parameters<Email<Props>>[0]) => render(<WeekStartedEmail {...props} />);

export const getPlainText = (props: Parameters<Email<Props>>[0]) =>
  render(<WeekStartedEmail {...props} />, {
    plainText: true,
  });
