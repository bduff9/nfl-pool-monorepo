import { weekSchema } from "@nfl-pool-monorepo/utils/validation";
import { type } from "arktype";
import type { Route } from "next";

const WEEK_QUERY_KEY = "week";

export const parseWeekParam = (value: unknown): number | null => {
  const raw = Array.isArray(value) ? value[0] : value;

  if (raw == null || raw === "") {
    return null;
  }

  const result = weekSchema(Number(raw));

  if (result instanceof type.errors) {
    return null;
  }

  return result;
};

const splitHref = (href: Route): { path: string; query: string | undefined; hash: string } => {
  const hashIndex = href.indexOf("#");
  const hash = hashIndex === -1 ? "" : href.slice(hashIndex);
  const beforeHash = hashIndex === -1 ? href : href.slice(0, hashIndex);
  const queryIndex = beforeHash.indexOf("?");
  const path = queryIndex === -1 ? beforeHash : beforeHash.slice(0, queryIndex);
  const query = queryIndex === -1 ? undefined : beforeHash.slice(queryIndex + 1);

  return { hash, path, query };
};

export const withWeek = (href: Route, week: number | null | undefined): Route => {
  if (!week) {
    return href;
  }

  const { path, query, hash } = splitHref(href);
  const params = new URLSearchParams(query);

  params.set(WEEK_QUERY_KEY, String(week));

  const queryString = params.toString();

  return `${path}${queryString ? `?${queryString}` : ""}${hash}` as Route;
};

export const appendWeekIfMissing = (href: Route, week: number | null | undefined): Route => {
  if (!week) {
    return href;
  }

  const { query } = splitHref(href);
  const params = new URLSearchParams(query);

  if (params.has(WEEK_QUERY_KEY)) {
    return href;
  }

  return withWeek(href, week);
};
