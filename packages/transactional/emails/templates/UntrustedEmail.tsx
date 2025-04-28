import { Button, Column, Container, Head, Html, Preview, render, Row, Section, Text } from "@react-email/components";
import { env } from "../../src/env";

import type { Email } from "../../src/types";

import BodyWrapper from "./_components/BodyWrapper";
import Footer from "./_components/Footer";
import Header from "./_components/Header";

type Props = {
  adminUserFirstName: string;
  newUserUserEmail: string;
  newUserUserName: string;
  newUserUserReferredByRaw: string;
};

const UntrustedEmail: Email<Props> = ({
  adminUserFirstName,
  browserLink,
  newUserUserEmail,
  newUserUserName,
  newUserUserReferredByRaw,
  unsubscribeLink,
}) => {
  const { domain } = env;
  const preview = "A new user requires verification by an admin";

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
                  <br />A new user needs your approval:
                </Text>
                <Text className="ml-8 text-lg">
                  {newUserUserName} just registered with the email {newUserUserEmail}.
                  <br />
                  They claim to be referred by {newUserUserReferredByRaw}.
                </Text>
                <Text className="text-lg">You can approve/remove them using the button below:</Text>
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

UntrustedEmail.PreviewProps = {
  adminUserFirstName: "John",
  browserLink: "https://example.com",
  newUserUserEmail: "jane@example.com",
  newUserUserName: "Jane",
  newUserUserReferredByRaw: "Bob Smith",
  unsubscribeLink: "https://example.com/unsubscribe",
};

export default UntrustedEmail;

export const getSubject = () => "New User Requires Admin Approval";

export const getHtml = (props: Parameters<Email<Props>>[0]) => render(<UntrustedEmail {...props} />);

export const getPlainText = (props: Parameters<Email<Props>>[0]) =>
  render(<UntrustedEmail {...props} />, {
    plainText: true,
  });
