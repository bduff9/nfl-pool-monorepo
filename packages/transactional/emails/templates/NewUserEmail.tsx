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
  isReturning: boolean;
  newUserUserEmail: string;
  newUserUserName: string;
  newUserUserReferredByRaw: string;
  newUserUserTeamName: string;
  yearsPlayed: string;
};

const NewUserEmail: Email<Props> = ({
  adminUserFirstName,
  browserLink,
  isReturning,
  newUserUserEmail,
  newUserUserName,
  newUserUserReferredByRaw,
  newUserUserTeamName,
  unsubscribeLink,
  yearsPlayed,
}) => {
  const { domain } = env;
  const preview = "This is an auto generated notice that a new user has just finished registering";

  return (
    <Html>
      <Head>
        <title>{getSubject()}</title>
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
                  This is just a notice that a {isReturning ? "returning" : "new"} user has just registered with the
                  following information:
                </Text>
                <ul className="mt-0.5 text-sm">
                  <li>Name: {newUserUserName}</li>
                  <li>Team Name: {newUserUserTeamName}</li>
                  <li>Email: {newUserUserEmail}</li>
                  {isReturning ? (
                    <li>Previous years played: {yearsPlayed}</li>
                  ) : (
                    <li>Referred by: {newUserUserReferredByRaw}</li>
                  )}
                </ul>
                <Text className="text-lg">You can maintain this user using the button below:</Text>
                <Button
                  className="bg-green-700 text-white w-full text-center py-2.5 rounded-md"
                  href={`${domain}/admin/users`}
                >
                  Manage Users
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

NewUserEmail.PreviewProps = {
  adminUserFirstName: "John",
  browserLink: "https://example.com",
  isReturning: true,
  newUserUserEmail: "jane@example.com",
  newUserUserName: "Jane",
  newUserUserReferredByRaw: "Bob Smith",
  newUserUserTeamName: "Example Team",
  unsubscribeLink: "https://example.com/unsubscribe",
  yearsPlayed: "2023, 2024",
};

export default NewUserEmail;

export const getSubject = () => "New User Registration";

export const getHtml = (props: Parameters<Email<Props>>[0]) => render(<NewUserEmail {...props} />);

export const getPlainText = (props: Parameters<Email<Props>>[0]) =>
  render(<NewUserEmail {...props} />, {
    plainText: true,
  });
