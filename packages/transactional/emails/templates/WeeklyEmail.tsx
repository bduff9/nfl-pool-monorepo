import { Button, Column, Container, Head, Html, Img, Preview, Row, Section, Text } from "@react-email/components";
import { render } from "@react-email/render";
// biome-ignore lint/style/useImportType: This is needed for react-email
import React from "react";

import { env } from "../../src/env";
import type { Email } from "../../src/types";
import { relativeTime, stripCharacterCount } from "../../src/util";
import BodyWrapper from "./_components/BodyWrapper";
import Footer from "./_components/Footer";
import Header from "./_components/Header";

type Props = {
  articles: {
    urlToImage: string | null;
    title: string;
    content: string;
    url: string;
    publishedAt: Date;
  }[];
  children?: React.ReactNode;
  messages: string[];
  poolUpdates: string[];
  survivorUpdates: string[];
  userFirstName: string;
  week: number;
};

const WeeklyEmail: Email<Props> = ({
  articles,
  browserLink,
  messages,
  poolUpdates,
  survivorUpdates,
  unsubscribeLink,
  userFirstName,
  week,
}) => {
  const { domain } = env;
  const preview = "Here is your official weekly email from the NFL Confidence Pool commissioners";

  return (
    <Html>
      <Head>
        <title>{getSubject(week)}</title>
      </Head>
      <BodyWrapper>
        <Preview>{preview}</Preview>
        <Container>
          <Header browserLink={browserLink} />

          <Section>
            <Row>
              <Column className="bg-white pt-8 px-6 pb-4">
                <Text className="text-xl">{userFirstName}'s Messages</Text>
                <ul>
                  {messages.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </Column>
            </Row>

            <Row>
              <Column className="bg-white pt-8 px-6">
                <Text className="text-xl">NFL Updates</Text>
              </Column>
            </Row>

            <Row>
              <Section>
                {articles.map((article) => (
                  <Section className="bg-white px-6 pb-4" key={article.url}>
                    <Img
                      className="w-full rounded-[8px] object-cover"
                      height={180}
                      src={article.urlToImage ?? "https://via.placeholder.com/180"}
                    />
                    <Text className="text-xl">{article.title}</Text>
                    <Text className="text-lg">{stripCharacterCount(article.content)}</Text>
                    <a href={article.url}>Read more</a>
                    <Text className="text-xs text-[#bbb]">{relativeTime(article.publishedAt)}</Text>
                  </Section>
                ))}
              </Section>
            </Row>

            <Row>
              <Column className="bg-white pt-8 px-6 pb-4">
                <Text className="text-xl">Confidence Pool Updates</Text>
                <ul>
                  {poolUpdates.map((update) => (
                    <li key={update}>{update}</li>
                  ))}
                </ul>
              </Column>
            </Row>

            <Row>
              <Column className="bg-white pt-8 px-6 pb-4">
                <Text className="text-xl">Survivor Pool Updates</Text>
                <ul>
                  {survivorUpdates.map((update) => (
                    <li key={update}>{update}</li>
                  ))}
                </ul>
              </Column>
            </Row>

            <Row>
              <Column className="bg-white pt-8 px-6 pb-4 rounded-b-xl">
                <Button className="bg-green-700 text-white w-full text-center py-2.5 rounded-md" href={`${domain}`}>
                  View full standings
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

WeeklyEmail.PreviewProps = {
  articles: [
    {
      content: "Content 1",
      publishedAt: new Date(),
      title: "Article 1",
      url: "https://example.com",
      urlToImage: "https://placehold.co/600x400",
    },
    {
      content: "Content 2",
      publishedAt: new Date(),
      title: "Article 2",
      url: "https://example.com",
      urlToImage: "https://placehold.co/600x400",
    },
    {
      content: "Content 3",
      publishedAt: new Date(),
      title: "Article 3",
      url: "https://example.com",
      urlToImage: "https://placehold.co/600x400",
    },
  ],
  browserLink: "https://example.com",
  messages: ["Please pay by Monday, September 30th, 2025"],
  poolUpdates: ["John Smith took first place this week"],
  survivorUpdates: ["2 people went out, there are still 14 people left in the survivor pool"],
  unsubscribeLink: "https://example.com/unsubscribe",
  userFirstName: "John",
  week: 1,
};

export default WeeklyEmail;

export const getSubject = (week: number) => `Week ${week} results`;

export const getHtml = (props: Parameters<Email<Props>>[0]) => render(<WeeklyEmail {...props} />);

export const getPlainText = (props: Parameters<Email<Props>>[0]) =>
  render(<WeeklyEmail {...props} />, {
    plainText: true,
  });
