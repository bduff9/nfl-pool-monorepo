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
  adminUserFirstName: string;
  children?: React.ReactNode;
  messages: Array<{ game: string; reason: string }>;
  week: number;
};

const InvalidGamesEmail: Email<Props> = ({ adminUserFirstName, browserLink, messages, unsubscribeLink, week }) => {
  const { domain } = env;
  const preview = "URGENT! Please read to resolve critical issues with the current NFL Pool schedule";

  return (
    <Html>
      <Head>
        <title>{getSubject(messages.length, week)}</title>
      </Head>
      <BodyWrapper>
        <Preview>{preview}</Preview>
        <Container>
          <Header browserLink={browserLink} />

          <Section>
            <Row>
              <Column className="bg-white pt-8 px-6 pb-4 rounded-b-xl">
                <Text className="text-lg">
                  Hello {adminUserFirstName},
                  <br />
                  <br />
                  This is a notification that the following {messages.length} games were found in week {week} that could
                  not be auto fixed:
                </Text>
                <ul>
                  {messages.map(({ game, reason }) => (
                    <li key={game}>
                      Game: {game}
                      <ul>
                        <li>{reason}</li>
                      </ul>
                    </li>
                  ))}
                </ul>
                <Text className="text-lg">
                  These will need to be manually fixed in the database. You can also click below to view all API calls
                  for this week.
                </Text>
                <Button
                  className="bg-green-700 text-white w-full text-center py-2.5 rounded-md"
                  href={`${domain}/admin/api`}
                >
                  View API Calls
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

InvalidGamesEmail.PreviewProps = {
  adminUserFirstName: "John",
  browserLink: "https://example.com",
  messages: [
    { game: "CHI @ DET starting at 2025-09-28T17:00:00", reason: "Game is found in database but not in API" },
    { game: "GB @ MIN starting at 2025-09-28T17:00:00", reason: "Game is found in API but not in database" },
  ],
  unsubscribeLink: "https://example.com/unsubscribe",
  week: 9,
};

export default InvalidGamesEmail;

export const getSubject = (count: number, week: number) => `${count} issues with week ${week} games found`;

export const getHtml = (props: Parameters<Email<Props>>[0]) => render(<InvalidGamesEmail {...props} />);

export const getPlainText = (props: Parameters<Email<Props>>[0]) =>
  render(<InvalidGamesEmail {...props} />, {
    plainText: true,
  });
