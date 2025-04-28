import { Column, Img, Link, Row, Section, Text } from "@react-email/components";
import { type FC } from "react";

type Props = {
  browserLink: string;
};

const Header: FC<Props> = ({ browserLink }) => {
  const { domain } = process.env;

  return (
    <>
      {browserLink && (
        <Section className="hide-for-browser">
          <Row>
            <Column valign="middle">
              <Text className="text-center">
                Email not displaying correctly? <Link href={browserLink}>View it in your browser</Link>
              </Text>
            </Column>
          </Row>
        </Section>
      )}

      <Section
        className={`bg-no-repeat bg-[url(${domain}/bkgd-pitch.png)] px-5 py-6`}
        style={{ backgroundSize: "100% 100%" }}
      >
        <Row>
          <Column>
            <Img
              alt="Football"
              className="mx-auto"
              height="150"
              src={`${domain}/football.png`}
              title="Football"
              width="150"
            />
          </Column>
        </Row>
      </Section>
    </>
  );
};

export default Header;
