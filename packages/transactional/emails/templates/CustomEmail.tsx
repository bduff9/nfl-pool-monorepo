import { Button, Column, Container, Head, Html, Preview, render, Row, Section, Text } from "@react-email/components";
import React from "react";
import { env } from "../../src/env";
import type { Email } from "../../src/types";
import BodyWrapper from "./_components/BodyWrapper";
import Footer from "./_components/Footer";
import Header from "./_components/Header";

type Props = {
  html: string;
	preview: string;
	subject: string;
  userFirstName: string;
};

const CustomEmail: Email<Props> = ({
  browserLink,
  html,
  preview,
	subject,
  userFirstName,
  unsubscribeLink,
}) => {
  const { domain } = env;

  return (
    <Html>
      <Head>
        <title>{subject}</title>
      </Head>
      <BodyWrapper>
        <Preview>{preview}</Preview>
        <Container>
          <Header browserLink={browserLink} />

          <Section>
            <Row>
              <Column className="bg-white pt-8 px-6 pb-4 rounded-b-xl">
                <Text className="text-lg">
                  Hello {userFirstName},
                </Text>

                {/* biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation> */}
                <div dangerouslySetInnerHTML={{ __html: html }} />

                <Text className="text-lg">Please do not hesitate to let me know if there are any questions or concerns,<br />Brian and Billy</Text>
                <Button
                  className="bg-green-700 text-white w-full text-center py-2.5 rounded-md"
                  href={`${domain}/`}
                >
                  Go to pool
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

CustomEmail.PreviewProps = {
  browserLink: "https://example.com",
  html: '<p><strong>Some</strong> <u>HTML</u> <i>content</i></p>',
	preview: 'Some very helpful preview text',
  subject: 'Some super interesting subject',
  unsubscribeLink: "https://example.com/unsubscribe",
  userFirstName: "John",
};

export default CustomEmail;

export const getHtml = (props: Parameters<Email<Props>>[0]) => render(<CustomEmail {...props} />);

export const getPlainText = (props: Parameters<Email<Props>>[0]) =>
  render(<CustomEmail {...props} />, {
    plainText: true,
  });
