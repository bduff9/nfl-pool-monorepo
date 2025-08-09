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
  notSelectedTeam: {
    TeamCity: string;
    TeamName: string;
    TeamPrimaryColor: string;
  };
  point: number;
  selectedTeam: {
    TeamCity: string;
    TeamName: string;
    TeamPrimaryColor: string;
  };
  userFirstName: string;
  week: number;
};

const QuickPickConfirmationEmail: Email<Props> = ({
  browserLink,
  notSelectedTeam,
  point,
  selectedTeam,
  unsubscribeLink,
  userFirstName,
  week,
}) => {
  const { domain } = env;
  const preview = `Your week ${week} quick pick has been saved.`;

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
                <Text className="text-xl">Phew {userFirstName}!</Text>

                <Text className="text-lg">
                  That was a close one! Your week {week} game 1 pick has been saved for {point} points.
                </Text>

                <Text>You picked the:</Text>

                <Text className="text-3xl font-bold" style={{ color: selectedTeam.TeamPrimaryColor }}>
                  {selectedTeam.TeamCity} {selectedTeam.TeamName}
                </Text>

                <Text>to beat the</Text>

                <Text className="text-xl font-semibold" style={{ color: notSelectedTeam.TeamPrimaryColor }}>
                  {notSelectedTeam.TeamCity} {notSelectedTeam.TeamName}
                </Text>

                <Button
                  className="bg-green-700 text-white w-full text-center py-2.5 rounded-md"
                  href={`${domain}/picks/set`}
                >
                  Finish your picks
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

QuickPickConfirmationEmail.PreviewProps = {
  browserLink: "https://example.com",
  notSelectedTeam: {
    TeamCity: "Chicago",
    TeamName: "Bears",
    TeamPrimaryColor: "#061E3E",
  },
  point: 2,
  selectedTeam: {
    TeamCity: "New York",
    TeamName: "Giants",
    TeamPrimaryColor: "#03497F",
  },
  unsubscribeLink: "https://example.com/unsubscribe",
  userFirstName: "John",
  week: 3,
};

export default QuickPickConfirmationEmail;

export const getSubject = (week: number) => `Week ${week} quick pick confirmation.`;

export const getHtml = (props: Parameters<Email<Props>>[0]) => render(<QuickPickConfirmationEmail {...props} />);

export const getPlainText = (props: Parameters<Email<Props>>[0]) =>
  render(<QuickPickConfirmationEmail {...props} />, {
    plainText: true,
  });
