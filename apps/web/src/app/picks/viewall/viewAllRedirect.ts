import type { Route } from "next";

import { withWeek } from "@/lib/weekSearchParams";

export const getViewAllRedirect = (hasSubmitted: boolean, rankingsCount: number, week: number): null | Route => {
  if (!hasSubmitted) {
    return withWeek("/picks/set", week);
  }

  if (rankingsCount === 0) {
    return withWeek("/picks/view", week);
  }

  return null;
};
