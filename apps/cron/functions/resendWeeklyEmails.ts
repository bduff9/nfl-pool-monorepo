// fallow-ignore-file unused-file -- CDK entry point, removed right after the one-off resend
import { getArticlesForWeek } from "@nfl-pool-monorepo/api/src/newsArticles";
import { sendWeeklyEmails } from "@nfl-pool-monorepo/transactional/src/alerts";
import type { Handler } from "aws-lambda";

// Temporary one-off: week 6's weekly emails all failed with "React is not defined". Delete after the resend.
const WEEK = 6;

export const handler: Handler<never, void> = async () => {
  console.log(`Resending week ${WEEK} weekly emails...`);

  await sendWeeklyEmails(WEEK, await getArticlesForWeek(WEEK));

  console.log(`Resent week ${WEEK} weekly emails`);
};
