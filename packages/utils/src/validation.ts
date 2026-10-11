import { type } from "arktype";

import { WEEKS_IN_SEASON } from "./constants";

export const weekSchema = type(`1 <= number.integer <= ${WEEKS_IN_SEASON}`);

const newsArticleSchema = type({
  author: "string | null",
  content: "string",
  description: "string",
  publishedAt: type("string | number | Date").pipe((d) => new Date(d)),
  source: {
    id: "string | null",
    name: "string",
  },
  title: "string",
  url: "string",
  urlToImage: "string | null",
});

export type APINewsArticle = typeof newsArticleSchema.infer;

export const newsArticlesSchema = type({
  articles: newsArticleSchema.array(),
  status: "string",
  totalResults: "number",
});
