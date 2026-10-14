import type { Route } from "next";

import { withWeek } from "@/lib/weekSearchParams";

// The quick pick lands on the picks of the week it was made for, not whichever week happens to be selected
export const getQuickPickLandingRoute = (week: unknown): Route =>
  withWeek("/picks/set", typeof week === "number" ? week : null);
