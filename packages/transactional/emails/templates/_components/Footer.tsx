import { Column, Link, Row, Section, Text } from "@react-email/components";
// biome-ignore lint/style/useImportType: This is needed for react-email
import * as React from "react";

type Props = {
  unsubscribeLink: string;
};

const Footer: React.FC<Props> = ({ unsubscribeLink }) => {
  const { domain } = process.env;

  return (
    <Section>
      <Row>
        <Column className="text-center pt-12 pb-5">
          <Text className="my-0">
            <Link href="https://asitewithnoname.com">asitewithnoname.com</Link>
          </Text>
          <Text className="my-0">Chicago, IL USA</Text>
          <Text className="my-0">
            <Link href={unsubscribeLink}>Unsubscribe</Link>
            {" | "}
            <Link href={`${domain}/users/edit`}>Update Preferences</Link>
          </Text>
        </Column>
      </Row>
    </Section>
  );
};

export default Footer;
