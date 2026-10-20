/*******************************************************************************
 * NFL Confidence Pool BE - the backend implementation of an NFL confidence pool.
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

import { db } from "@nfl-pool-monorepo/db/src/kysely";
import type { NewsArticle } from "@nfl-pool-monorepo/utils/validation";
import { type } from "arktype";

import { fetchWithRetry } from "./fetchWithRetry";

const ESPN_NEWS_URL = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=50";
const JEV_URL = "https://api.typesafe.ai/v1/systemone";
const JEV_MODEL = "jev-1.14.0";
const ARTICLE_COUNT = 3;
const MAX_CANDIDATES = 40;

const espnNewsSchema = type({
  articles: type({
    "description?": "string",
    headline: "string",
    "images?": type({ url: "string" }).array(),
    links: { web: { href: "string" } },
    published: "string",
    type: "string",
  }).array(),
});

const jevAnswersSchema = type({
  answers: {
    isFiller: { noul: "number" },
    isMajor: { noul: "number" },
    isUpset: { noul: "number" },
  },
});

const JEV_QUESTIONS = {
  isFiller: {
    instructions:
      "Is this mainly fantasy football advice, betting, draft talk, a power ranking, or a preview of an upcoming game rather than news about something that already happened?",
    type: "noul",
  },
  isMajor: {
    instructions:
      "Is this a major NFL story, such as a star player's serious injury, a coaching change, a trade, a record, or a notable game result?",
    type: "noul",
  },
  isUpset: {
    instructions: "Does this report a surprising upset or an unexpected result in a game that was already played?",
    type: "noul",
  },
} as const;

type Candidate = NewsArticle & { type: string };

// Used when Jev can't score an article: game recaps first, then ESPN's headlines, then everything else. The sort is
// stable, so ties keep ESPN's own ordering.
const getFallbackScore = ({ type }: Candidate): number => {
  if (type === "Recap") {
    return 1;
  }

  return type === "HeadlineNews" ? 0.6 : 0.5;
};

const getCandidates = async (since: Date): Promise<Candidate[]> => {
  const response = await fetchWithRetry(ESPN_NEWS_URL);

  if (!response.ok) {
    throw new Error(`ESPN news HTTP error! status: ${response.status}`);
  }

  const feed = espnNewsSchema(await response.json());

  if (feed instanceof type.errors) {
    throw new Error(`ESPN news returned invalid data: ${feed.summary}`);
  }

  return feed.articles
    .filter(
      (article) =>
        article.type !== "Media" &&
        article.links.web.href.includes("/nfl/") &&
        !!article.images?.[0] &&
        new Date(article.published) >= since,
    )
    .slice(0, MAX_CANDIDATES)
    .map((article) => ({
      content: article.description ?? "",
      publishedAt: new Date(article.published),
      title: article.headline,
      type: article.type,
      url: article.links.web.href,
      urlToImage: article.images?.[0]?.url ?? null,
    }));
};

// Upsets and major stories rank highest, and anything that reads as filler is discounted toward zero
const scoreArticle = async (article: Candidate): Promise<number> => {
  const response = await fetchWithRetry(JEV_URL, {
    body: JSON.stringify({
      model: JEV_MODEL,
      questions: JEV_QUESTIONS,
      state: `${article.title}\n${article.content}`,
    }),
    headers: { Authorization: `Bearer ${process.env.TYPESAFE_API_KEY}`, "Content-Type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Jev HTTP error! status: ${response.status}`);
  }

  const result = jevAnswersSchema(await response.json());

  if (result instanceof type.errors) {
    throw new Error(`Jev returned invalid data: ${result.summary}`);
  }

  const { isFiller, isMajor, isUpset } = result.answers;

  return (isMajor.noul + isUpset.noul * 1.5) * (1 - isFiller.noul);
};

// Jev only helps rank. If it is down or answers badly, the article keeps its deterministic fallback score and the
// failure is logged, so the weekly email still gets the best articles we can find without it.
const scoreCandidates = async (candidates: Candidate[], week: number) => {
  const results = await Promise.allSettled(candidates.map(scoreArticle));
  const failures = results.filter((result) => result.status === "rejected");

  if (failures.length > 0) {
    console.error("Jev could not score some articles, using fallback ranking for them", {
      error: failures[0]?.reason,
      failed: failures.length,
      total: candidates.length,
      week,
    });
  }

  return candidates.map((candidate, index) => {
    const result = results[index];

    return { candidate, score: result?.status === "fulfilled" ? result.value : getFallbackScore(candidate) };
  });
};

/**
 * The most notable articles from ESPN since the week's first kickoff, or none if ESPN itself can't be read: the
 * weekly email is fine without articles, and a news hiccup should never hold up finalizing the week.
 */
export const getArticlesForWeek = async (week: number): Promise<NewsArticle[]> => {
  try {
    const firstGame = await db
      .selectFrom("Games")
      .select("GameKickoff")
      .where("GameNumber", "=", 1)
      .where("GameWeek", "=", week)
      .executeTakeFirstOrThrow();
    const candidates = await getCandidates(firstGame.GameKickoff);
    const scored = await scoreCandidates(candidates, week);

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, ARTICLE_COUNT)
      .map(({ candidate: { type: _type, ...article } }) => article);
  } catch (error) {
    console.error("Could not get articles, sending without any", { error, week });

    return [];
  }
};
