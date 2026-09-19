import * as React from "react";
import { Column, Row, Section } from "react-email";

import Header from "./Header";

type Props = {
  browserLink: string;
  children: React.ReactNode;
};

const EmailBodySection = ({ browserLink, children }: Props) => (
  <React.Fragment>
    <Header browserLink={browserLink} />

    <Section>
      <Row>
        <Column className="bg-white pt-8 px-6 pb-4 rounded-b-xl">{children}</Column>
      </Row>
    </Section>
  </React.Fragment>
);

export default EmailBodySection;
