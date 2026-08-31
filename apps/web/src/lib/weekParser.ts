"use client";

import { createParser } from "nuqs";

import { parseWeekParam } from "./weekSearchParams";

export const weekParser = createParser({
  parse: (queryValue) => parseWeekParam(queryValue),
  serialize: (value) => String(value),
});
