import { type } from "arktype";

import { WEEKS_IN_SEASON } from "./constants";

export const weekSchema = type(`1 <= number.integer <= ${WEEKS_IN_SEASON}`);

export type NewsArticle = {
  content: string;
  publishedAt: Date;
  title: string;
  url: string;
  urlToImage: string | null;
};
