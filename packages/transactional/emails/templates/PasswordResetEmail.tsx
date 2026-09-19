import { render } from "@react-email/render";
// biome-ignore lint/style/useImportType: This is needed for react-email
import * as React from "react";
import { Button, Container, Html, Preview, Section, Text } from "react-email";

import { env } from "../../src/env";
import type { Email } from "../../src/types";
import BodyWrapper from "./_components/BodyWrapper";
import EmailBodySection from "./_components/EmailBodySection";
import Footer from "./_components/Footer";

type Props = {
  children?: React.ReactNode;
  otp: string;
  userFirstName?: string | undefined;
};

const PasswordResetEmail: Email<Props> = ({ browserLink, otp, userFirstName, unsubscribeLink }) => {
  const { domain } = env;
  const preview = "Your password reset verification code";

  return (
    <Html>
      <BodyWrapper title={getSubject()}>
        <Preview>{preview}</Preview>
        <Container className="max-w-[600px] md:max-w-[800px]">
          <EmailBodySection browserLink={browserLink}>
            <Text className="text-lg">
              Hello {userFirstName || "there"},
              <br />
              <br />
              You requested to reset your password for the NFL Confidence Pool. Please use the verification code below
              to complete your password reset:
            </Text>

            <Section className="bg-gray-100 rounded-lg py-6 px-4 my-6 text-center">
              <Text className="text-3xl font-bold tracking-wider text-gray-900 mb-0">{otp}</Text>
              <Text className="text-sm text-gray-600 mt-2 mb-0">This code will expire in 15 minutes</Text>
            </Section>

            <Text className="text-lg">
              Enter this code on the password reset page to set your new password.
              <br />
              <br />
              If you didn't request a password reset, you can safely ignore this email. Your password will remain
              unchanged.
              <br />
              <br />
              Thanks!
              <br />
              Brian and Billy
            </Text>

            <Button
              className="bg-blue-600 text-white py-3 px-6 rounded-lg text-center block mx-auto mt-6"
              href={`${domain}/auth/forgot-password`}
            >
              Reset Password
            </Button>
          </EmailBodySection>

          <Footer unsubscribeLink={unsubscribeLink} />
        </Container>
      </BodyWrapper>
    </Html>
  );
};

PasswordResetEmail.PreviewProps = {
  browserLink: "https://confidence.example.com/api/email/123",
  otp: "123456",
  unsubscribeLink: "https://confidence.example.com/api/email/unsubscribe?email=test@example.com",
  userFirstName: "John",
} as const;

export const getSubject = (): string => "Password Reset Verification Code";

export const getHtml = async (props: Parameters<typeof PasswordResetEmail>[0]): Promise<string> => {
  return await render(<PasswordResetEmail {...props} />);
};

export const getPlainText = (props: Parameters<Email<Props>>[0]) =>
  render(<PasswordResetEmail {...props} />, {
    plainText: true,
  });

export default PasswordResetEmail;
