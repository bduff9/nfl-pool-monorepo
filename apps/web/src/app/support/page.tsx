/*******************************************************************************
 * NFL Confidence Pool FE - the frontend implementation of an NFL confidence pool.
 * Copyright (C) 2015-present Brian Duffey
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see {http://www.gnu.org/licenses/}.
 * Home: https://asitewithnoname.com/
 */
import type { SupportContent } from "@nfl-pool-monorepo/db/src";
import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { Button } from "@nfl-pool-monorepo/ui/components/button";
import { Separator } from "@nfl-pool-monorepo/ui/components/separator";
import Fuse, { type FuseResult } from "fuse.js";
import type { Selectable } from "kysely";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import CustomHead from "@/components/CustomHead/CustomHead";
import { ProgressBarLink } from "@/components/ProgressBar/ProgressBar";
import SlackLink from "@/components/SlackLink/slackLink";
import SupportSearch from "@/components/SupportSearch/supportSearch";
import type { NP } from "@/lib/types";
import { writeLog } from "@/server/actions/logs";
import { getCurrentSession } from "@/server/loaders/sessions";

const TITLE = "Support/FAQs";

export const metadata: Metadata = {
  title: TITLE,
};

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const resolveAttribute = <T extends Record<string, any>>(obj: T, key: string): T =>
  key.split(".").reduce((prev, curr) => prev?.[curr], obj);

const highlight = (value: string, indices: [number, number][] = []): ReactNode => {
  const pair = indices.pop();

  if (!pair) {
    return <>{value}</>;
  }

  return (
    <>
      {highlight(value.substring(0, pair[0]), indices)}
      <mark>{value.substring(pair[0], pair[1] + 1)}</mark>
      {value.substring(pair[1] + 1)}
    </>
  );
};

type FuseHighlightProps<T> = {
  attribute: string;
  hit: T;
};

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const FuseHighlight = <T extends Record<string, any>>({ attribute, hit }: FuseHighlightProps<T>): ReactNode => {
  const matches = typeof hit.item === "string" ? hit.matches?.[0] : hit.matches?.find((m: T) => m.key === attribute);
  const fallback = typeof hit.item === "string" ? hit.item : resolveAttribute(hit.item, attribute);

  return highlight(matches?.value || fallback, matches?.indices);
};

const convertTextToAnchor = (text: string): string => text.toLowerCase().replace(/\W/g, "");

const createFAQList = (faqs: FuseResult<Selectable<SupportContent>>[]): ReactNode => {
  if (faqs.length === 0) {
    return <div className="text-muted italic">No results found</div>;
  }

  const faqList: ReactNode[] = [];
  let category: null | string = "";

  for (const faq of faqs) {
    if (faq.item.SupportContentCategory !== category) {
      category = faq.item.SupportContentCategory;
      faqList.push(
        <h3 className="text-3xl mb-2" id={convertTextToAnchor(category || "")} key={`category-${category}`}>
          {category}
        </h3>,
      );
    }

    faqList.push(
      <details className="text-emerald-600 ml-20 mb-3" key={`faq-${faq.item.SupportContentID}`}>
        <summary className="text-black -ml-12">
          <FuseHighlight attribute="SupportContentDescription" hit={faq} />
        </summary>
        <FuseHighlight attribute="SupportContentDescription2" hit={faq} />
      </details>,
    );
  }

  return <>{faqList}</>;
};

const createRuleList = (rules: FuseResult<Selectable<SupportContent>>[]): ReactNode => {
  if (rules.length === 0) {
    return <div className="text-muted italic">No results found</div>;
  }

  const ruleList: ReactNode[] = [];

  for (const rule of rules) {
    ruleList.push(
      <li className="mb-4" key={`rule-${rule.item.SupportContentID}`}>
        <FuseHighlight attribute="SupportContentDescription" hit={rule} />
      </li>,
    );
  }

  return <ol className="list-decimal pl-8">{ruleList}</ol>;
};

const getSupportContent = async (): Promise<{
  faqs: Selectable<SupportContent>[];
  rules: Selectable<SupportContent>[];
  slackLink: string;
  supportEmail: string;
}> => {
  const [faqs, rules, supportEmail, slackLink] = await Promise.all([
    db
      .selectFrom("SupportContent")
      .selectAll()
      .where("SupportContentType", "=", "FAQ")
      .where("SupportContentDeleted", "is", null)
      .orderBy("SupportContentCategory", "asc")
      .orderBy("SupportContentOrder", "asc")
      .execute(),
    db
      .selectFrom("SupportContent")
      .selectAll()
      .where("SupportContentType", "=", "Rule")
      .where("SupportContentDeleted", "is", null)
      .orderBy("SupportContentOrder", "asc")
      .execute(),
    db
      .selectFrom("SystemValues")
      .select("SystemValueValue")
      .where("SystemValueName", "=", "SupportEmail")
      .where("SystemValueDeleted", "is", null)
      .executeTakeFirstOrThrow(),
    db
      .selectFrom("SystemValues")
      .select("SystemValueValue")
      .where("SystemValueName", "=", "SlackLink")
      .where("SystemValueDeleted", "is", null)
      .executeTakeFirstOrThrow(),
  ]);

  return {
    faqs,
    rules,
    slackLink: slackLink.SystemValueValue ?? "ERROR",
    supportEmail: supportEmail.SystemValueValue ?? "ERROR",
  };
};

const logSupportSearch = async (value: string): Promise<void> => {
  try {
    await writeLog({
      LogAction: "SUPPORT_SEARCH",
      LogData: null,
      LogMessage: value,
    });
  } catch (error) {
    console.error({ error, text: "Error when writing log for support search: " });
  }
};

const Support: NP = async ({ searchParams }) => {
  const { session, user } = await getCurrentSession();
  const { faqs, rules, slackLink, supportEmail } = await getSupportContent();
  const { q = "" } = await searchParams;
  const query = Array.isArray(q) ? "" : q;
  let faqMarkup: ReactNode;
  let ruleMarkup: ReactNode;

  if (query.length > 2) {
    await logSupportSearch(query);
    const searchQuery = `'${query.split(/\s/).join(" '")}`;
    const faqFuse = new Fuse(faqs, {
      findAllMatches: true,
      ignoreFieldNorm: true,
      ignoreLocation: true,
      includeMatches: true,
      includeScore: true,
      keys: [
        "SupportContentDescription",
        "SupportContentDescription2",
        "SupportContentCategory",
        "SupportContentKeywords",
      ],
      minMatchCharLength: 3,
      shouldSort: false,
      threshold: 0,
      useExtendedSearch: true,
    });
    const faqHits = faqFuse.search(searchQuery);

    faqMarkup = createFAQList(faqHits);

    const ruleFuse = new Fuse(rules, {
      findAllMatches: true,
      ignoreFieldNorm: true,
      ignoreLocation: true,
      includeMatches: true,
      includeScore: true,
      keys: ["SupportContentDescription", "SupportContentKeywords"],
      minMatchCharLength: 3,
      shouldSort: false,
      threshold: 0,
      useExtendedSearch: true,
    });
    const ruleHits = ruleFuse.search(searchQuery);

    ruleMarkup = createRuleList(ruleHits);
  } else {
    faqMarkup = createFAQList(
      faqs.map((item, refIndex) => ({
        item,
        matches: [],
        refIndex,
        score: 1,
      })),
    );
    ruleMarkup = createRuleList(
      rules.map((item, refIndex) => ({
        item,
        matches: [],
        refIndex,
        score: 1,
      })),
    );
  }

  return (
    <div className="h-full flex flex-wrap max-w-full px-2">
      <CustomHead title={TITLE} />
      <div
        className="bg-gray-100/80 text-black pt-5 md:pt-3 min-h-screen pb-4 px-3 grow shrink-0 max-w-full"
        id="top"
      >
        <SupportSearch currentQuery={query} />
        <h2 className="text-4xl text-center mb-0" id="rules">
          Rules
        </h2>
        <Separator className="my-4 h-px bg-gray-400" />
        {ruleMarkup}
        <h2 className="text-4xl text-center mb-0" id="faq">
          FAQ
        </h2>
        <Separator className="my-4 h-px bg-gray-400" />
        {faqMarkup}
        <h2 className="text-4xl text-center mb-0" id="contact">
          Contact Us
        </h2>
        <Separator className="my-4 h-px bg-gray-400" />
        <div className="text-center">
          <SlackLink href={slackLink} userId={user?.id} />
          <br />
          <br />
          Feel free to reach out for any questions or issues you may have
          <br />
          <a className="underline text-sky-600" href={`mailto:${supportEmail}`}>
            {supportEmail}
          </a>
          <br />
          <br />
          {!session && (
            <Button asChild variant="primary">
              <ProgressBarLink href="/auth/login">Back to login</ProgressBarLink>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Support;
