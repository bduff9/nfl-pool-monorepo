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
  pickedTeamName?: string;
  userFirstName: string;
  week: number;
};

const SurvivorEliminatedEmail: Email<Props> = ({
  browserLink,
  pickedTeamName,
  unsubscribeLink,
  userFirstName,
  week,
}) => {
  const { domain } = env;
  const preview = "This is an automated email to let you know you have been eliminated from the survivor pool";
  const reason = pickedTeamName
    ? `Your ${pickedTeamName} pick lost in week ${week}, which ends your survivor run.`
    : `You didn't make a survivor pick for week ${week}, which ends your survivor run.`;

  return (
    <Html>
      <BodyWrapper title={getSubject(week)}>
        <Preview>{preview}</Preview>
        <Container className="max-w-[600px] md:max-w-[800px]">
          <EmailBodySection browserLink={browserLink}>
            <Text className="text-xl">Hello {userFirstName},</Text>

            <Text className="text-lg">{reason}</Text>

            <Text className="text-base">
              The overall confidence pool is still wide open, though &mdash; keep those weekly picks coming!
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

SurvivorEliminatedEmail.PreviewProps = {
  browserLink: "https://asitewithnoname.com",
  pickedTeamName: "New England Patriots",
  unsubscribeLink: "https://asitewithnoname.com",
  userFirstName: "John",
  week: 4,
};

export const getSubject = (week: number): string => `You've been eliminated from the survivor pool (week ${week})`;

export const getHtml = (props: Parameters<Email<Props>>[0]): Promise<string> =>
  render(<SurvivorEliminatedEmail {...props} />);

export const getPlainText = (props: Parameters<Email<Props>>[0]): Promise<string> =>
  render(<SurvivorEliminatedEmail {...props} />, {
    plainText: true,
  });

export default SurvivorEliminatedEmail;
