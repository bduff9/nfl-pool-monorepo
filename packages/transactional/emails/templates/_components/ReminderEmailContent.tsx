// biome-ignore lint/style/useImportType: This is needed for react-email
import * as React from "react";
import { Button, Column, Row, Section, Text } from "react-email";

type Props = {
  actionHref: string;
  actionLabel: string;
  message: React.ReactNode;
  userFirstName: string;
};

const ReminderEmailContent = ({ actionHref, actionLabel, message, userFirstName }: Props) => (
  <Section>
    <Row>
      <Column className="bg-white pt-8 px-6 pb-4 rounded-b-xl">
        <Text className="text-lg">
          Hello forgetful {userFirstName},
          <br />
          <br />
          {message}
          <br />
          <br />
          Good luck!
        </Text>
        <Button className="bg-green-700 text-white w-full text-center py-2.5 rounded-md" href={actionHref}>
          {actionLabel}
        </Button>
      </Column>
    </Row>
  </Section>
);

export default ReminderEmailContent;
