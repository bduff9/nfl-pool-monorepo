// The three dashboard cards (weekly, overall, survivor) and their skeletons share the dashboard grid's rows on desktop
// (CSS subgrid), so each section starts at the same height in all three cards whatever messages or links a card shows:
// row 1 the title, row 2 the status and links, then the sections below on the rows named here.
export const DASHBOARD_CARD = "md:grid md:grid-rows-subgrid md:row-span-6";

export const DASHBOARD_ROW = {
  chart: "md:row-start-3",
  firstBar: "md:row-start-5",
  resultsTitle: "md:row-start-4",
  secondBar: "md:row-start-6",
} as const;
