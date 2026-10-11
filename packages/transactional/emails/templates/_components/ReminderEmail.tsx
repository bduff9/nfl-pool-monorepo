// biome-ignore lint/style/useImportType: This is needed for react-email
import * as React from "react";
import { Container, Html, Preview } from "react-email";

import BodyWrapper from "./BodyWrapper";
import Footer from "./Footer";
import Header from "./Header";
import ReminderEmailContent from "./ReminderEmailContent";

export type ReminderEmailProps = {
  children?: React.ReactNode;
  hoursLeft: number;
  userFirstName: string;
  week: number;
};

export const reminderPreviewProps = {
  browserLink: "https://example.com",
  hoursLeft: 2,
  unsubscribeLink: "https://example.com/unsubscribe",
  userFirstName: "John",
  week: 1,
};

export const getReminderSubject = (firstName: string) => `Hurry up, ${firstName}!`;

type Props = {
  actionHref: string;
  actionLabel: string;
  browserLink: string;
  message: React.ReactNode;
  preview: string;
  unsubscribeLink: string;
  userFirstName: string;
};

const ReminderEmail = ({
  actionHref,
  actionLabel,
  browserLink,
  message,
  preview,
  unsubscribeLink,
  userFirstName,
}: Props) => (
  <Html>
    <BodyWrapper title={getReminderSubject(userFirstName)}>
      <Preview>{preview}</Preview>
      <Container className="max-w-[600px] md:max-w-[800px]">
        <Header browserLink={browserLink} />

        <ReminderEmailContent
          actionHref={actionHref}
          actionLabel={actionLabel}
          message={message}
          userFirstName={userFirstName}
        />

        <Footer unsubscribeLink={unsubscribeLink} />
      </Container>
    </BodyWrapper>
  </Html>
);

export default ReminderEmail;
