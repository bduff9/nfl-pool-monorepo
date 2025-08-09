import type { Users } from "@nfl-pool-monorepo/db/src";
import { db } from "@nfl-pool-monorepo/db/src/kysely";
import { getUserAlerts } from "@nfl-pool-monorepo/db/src/queries/user";
import type { Selectable } from "kysely";

import { getArticlesForWeek } from "@nfl-pool-monorepo/api/src/newsArticles";
import { getSurvivorPoolStatus } from "@nfl-pool-monorepo/db/src/queries/survivor";
import { addOrdinal } from "@nfl-pool-monorepo/utils/numbers";
import { getBaseEmailClass, getBrowserLink, getUnsubscribeLink, sendEmail, updateEmailClass } from ".";
import { getHtml, getPlainText, getSubject } from "./templates/WeeklyEmail";

export const sendWeeklyEmail = async (
  user: Pick<Selectable<Users>, "UserID" | "UserEmail" | "UserFirstName">,
  week: number,
): Promise<void> => {
	const userMessages: string[] = [];
	const poolUpdates: string[] = [];
	const survivorUpdates: string[] = [];
	const myPoolRank = await db.selectFrom("WeeklyMV").select('Rank').where('Week', '=', week).where('UserID', '=', user.UserID).executeTakeFirstOrThrow();
	const mySurvivorRank = await db.selectFrom("SurvivorMV").select(["IsAliveOverall", "WeeksAlive"]).where('UserID', '=', user.UserID).executeTakeFirst();
	const poolRanks = await db.selectFrom("WeeklyMV as wmv").innerJoin("Users as u", 'u.UserID', 'wmv.UserID').select(["Rank", "UserFirstName", "UserLastName"]).where('Week', '=', week).where('Rank', '<', 3).execute();
	const newlyDead = await db.selectFrom("SurvivorMV").select("UserID").where("IsAliveOverall", '=', 0).where("WeeksAlive", '=', week).execute();
	const alerts = await getUserAlerts(user.UserID);

	if (myPoolRank.Rank < 3) {
		userMessages.push(
			`Congrats, you took ${addOrdinal(myPoolRank.Rank)} place this week in the pool!`,
		);
	} else {
		userMessages.push(
			`You finished ${addOrdinal(myPoolRank.Rank)} place this week in the pool.`,
		);
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

				if (i === list.length - 1)
					return `${acc}${list.length > 2 ? ',' : ''} and ${name}`;

				return `${acc}, ${name}`;
			}, '');

		survivorUpdates.push(
			`The survivor pool is officially over.  ${names} won this season's pool.  Congrats!`,
		);
	} else {
		survivorUpdates.push(
			`There are still ${survivorStatus.stillAlive.length} people left alive`,
		);
	}

	const articles = await getArticlesForWeek(week);
  const to = [user.UserEmail];
  const emailId = await getBaseEmailClass({ to, type: "weekly" });
  const browserLink = getBrowserLink(emailId);
  const unsubscribeLink = getUnsubscribeLink(to);
  const subject = getSubject(week);
  const html = await getHtml({
    articles,
    browserLink,
    messages: userMessages,
    poolUpdates,
    survivorUpdates,
    unsubscribeLink,
    userFirstName: user.UserFirstName ?? "player",
    week,
  });
  const text = await getPlainText({
    articles,
    browserLink,
    messages: userMessages,
    poolUpdates,
    survivorUpdates,
    unsubscribeLink,
    userFirstName: user.UserFirstName ?? "player",
    week,
  });

  try {
    await sendEmail({
      html,
      subject,
      text,
      to,
    });
  } catch (error) {
    console.error("Failed to send weekly email: ", {
      error,
      props: {
        articles,
        browserLink,
        messages: userMessages,
        poolUpdates,
        survivorUpdates,
        unsubscribeLink,
        userFirstName: user.UserFirstName ?? "player",
        week,
      },
      to,
      type: "weekly",
    });
  }

  await updateEmailClass({
    emailId,
    html,
    subject,
    text,
  });
};
