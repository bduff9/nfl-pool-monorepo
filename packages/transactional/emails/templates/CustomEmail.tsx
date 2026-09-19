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
  html: string;
  preview: string;
  subject: string;
  userFirstName: string;
};

const CustomEmail: Email<Props> = ({ browserLink, html, preview, subject, userFirstName, unsubscribeLink }) => {
  const { domain } = env;

  return (
    <Html>
      <BodyWrapper title={subject}>
        <Preview>{preview}</Preview>
        <Container className="max-w-[600px] md:max-w-[800px]">
          <EmailBodySection browserLink={browserLink}>
            <Text className="text-lg">Hello {userFirstName},</Text>

            {/* biome-ignore lint/security/noDangerouslySetInnerHtml: The HTML is provided by an admin and is considered safe. */}
            <div dangerouslySetInnerHTML={{ __html: html }} />

            <Text className="text-lg">
              Please do not hesitate to let me know if there are any questions or concerns,
              <br />
              Brian and Billy
            </Text>
            <Button className="bg-green-700 text-white w-full text-center py-2.5 rounded-md" href={`${domain}/`}>
              Go to pool
            </Button>
          </EmailBodySection>

          <Footer unsubscribeLink={unsubscribeLink} />
        </Container>
      </BodyWrapper>
    </Html>
  );
};

CustomEmail.PreviewProps = {
  browserLink: "https://example.com",
  html: "<p><strong>Some</strong> <u>HTML</u> <i>content</i></p>",
  preview: "Some very helpful preview text",
  subject: "Some super interesting subject",
  unsubscribeLink: "https://example.com/unsubscribe",
  userFirstName: "John",
};

export default CustomEmail;

export const getHtml = (props: Parameters<Email<Props>>[0]) => render(<CustomEmail {...props} />);

export const getPlainText = (props: Parameters<Email<Props>>[0]) =>
  render(<CustomEmail {...props} />, {
    plainText: true,
  });
