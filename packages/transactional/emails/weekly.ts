import type { Users } from "@nfl-pool-monorepo/db/src";
import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { getSurvivorPoolStatus } from "@nfl-pool-monorepo/db/src/queries/survivor";
import { getUserAlerts } from "@nfl-pool-monorepo/db/src/queries/user";
import { addOrdinal } from "@nfl-pool-monorepo/utils/numbers";
import type { NewsArticle } from "@nfl-pool-monorepo/utils/validation";
import type { Selectable } from "kysely";

import { getUserRecap, type WeekRecap } from "../src/recap";
import { getBaseEmailClass, getBrowserLink, getUnsubscribeLink, sendEmail, updateEmailClass } from ".";
import { getHtml, getPlainText, getSubject } from "./templates/WeeklyEmail";

export const sendWeeklyEmail = async (
  user: Pick<Selectable<Users>, "UserID" | "UserEmail" | "UserFirstName">,
  week: number,
  weekArticles: NewsArticle[],
  recap: WeekRecap | null,
): Promise<void> => {
  const userMessages: string[] = [];
  const poolUpdates: string[] = [];
  const survivorUpdates: string[] = [];
  const [myPoolRank, mySurvivorRank, poolRanks, newlyDead, alerts] = await Promise.all([
    db
      .selectFrom("WeeklyMV")
      .select("Rank")
      .where("Week", "=", week)
      .where("UserID", "=", user.UserID)
      .executeTakeFirstOrThrow(),
    db
      .selectFrom("SurvivorMV")
      .select(["IsAliveOverall", "WeeksAlive"])
      .where("UserID", "=", user.UserID)
      .executeTakeFirst(),
    db
      .selectFrom("WeeklyMV as wmv")
      .innerJoin("Users as u", "u.UserID", "wmv.UserID")
      .select(["Rank", "UserFirstName", "UserLastName"])
      .where("Week", "=", week)
      .where("Rank", "<", 3)
      .execute(),
    db
      .selectFrom("SurvivorMV")
      .select("UserID")
      .where("IsAliveOverall", "=", 0)
      .where("WeeksAlive", "=", week)
      .execute(),
    getUserAlerts(user.UserID),
  ]);

  if (myPoolRank.Rank < 3) {
    userMessages.push(`Congrats, you took ${addOrdinal(myPoolRank.Rank)} place this week in the pool!`);
  } else {
    userMessages.push(`You finished ${addOrdinal(myPoolRank.Rank)} place this week in the pool.`);
  }

  if (mySurvivorRank?.IsAliveOverall) {
    userMessages.push(`You are still alive in the survivor pool.  Keep it up!`);
  } else if (mySurvivorRank?.WeeksAlive === week) {
    userMessages.push(`Tough luck, you went out of the survivor pool this week.`);
  }

  userMessages.push(...alerts);

  for (const poolRank of poolRanks) {
    const { Rank, ...user } = poolRank;
    const name = `${user.UserFirstName} ${user.UserLastName}`;
    const ordinal = addOrdinal(Rank);

    poolUpdates.push(`${ordinal}:  ${name}`);
  }

  survivorUpdates.push(`${newlyDead.length} people went out of survivor this week`);

  const survivorStatus = await getSurvivorPoolStatus(week);

  if (survivorStatus.ended) {
    const names = survivorStatus.winners
      .map((user) => `${user.UserFirstName} ${user.UserLastName}`)
      .reduce((acc, name, i, list) => {
        if (!acc) return name;

        if (i === list.length - 1) return `${acc}${list.length > 2 ? "," : ""} and ${name}`;

        return `${acc}, ${name}`;
      }, "");

    survivorUpdates.push(`The survivor pool is officially over.  ${names} won this season's pool.  Congrats!`);
  } else {
    survivorUpdates.push(`There are still ${survivorStatus.stillAlive.length} people left alive`);
  }

  const to = [user.UserEmail];
  const emailId = await getBaseEmailClass({ to, type: "weekly" });
  const browserLink = getBrowserLink(emailId);
  const unsubscribeLink = getUnsubscribeLink(to);
  const subject = getSubject(week);
  const props = {
    articles: weekArticles,
    browserLink,
    messages: userMessages,
    poolUpdates,
    recap: getUserRecap(recap, user.UserID),
    survivorUpdates,
    unsubscribeLink,
    userFirstName: user.UserFirstName ?? "player",
    week,
  };
  const [html, text] = await Promise.all([getHtml(props), getPlainText(props)]);

  try {
    await sendEmail({
      html,
      subject,
      text,
      to,
    });
  } catch (error) {
    console.error("Failed to send weekly email: ", { error, props, to, type: "weekly" });
  }

  await updateEmailClass({
    emailId,
    html,
    subject,
    text,
  });
};
