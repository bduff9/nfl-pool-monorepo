/*******************************************************************************
 * NFL Confidence Pool BE - the backend implementation of an NFL confidence pool.
 * Copyright (C) 2015-present Brian Duffey
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see {http://www.gnu.org/licenses/}.
 * Home: https://asitewithnoname.com/
 */

import { db } from '@nfl-pool-monorepo/db/src/kysely';
import type { User } from '@nfl-pool-monorepo/types';
import { sendSMS } from '.';

const sendPicksSubmittedSMS = async (
	user: User,
	week: number,
	tiebreakerLastScore: number,
): Promise<void> => {
	const userResult = await db.selectFrom("Users").select(["UserFirstName", "UserPhone"]).where("UserID", "=", user.id).executeTakeFirstOrThrow();
	const picks = await db.selectFrom('Picks as p')
		.select(['p.PickPoints', 'p.TeamID'])
		.innerJoin('Games as g', 'g.GameID', 'p.GameID')
		.leftJoin('Teams as t', 't.TeamID', 'p.TeamID')
		.select(['t.TeamShortName'])
		.where('g.GameWeek', '=', week)
		.where('p.UserID', '=', user.id)
		.execute();
	let message = `Hi ${userResult.UserFirstName},
This is a confirmation that your week ${week} picks have been submitted.
Your picks are:`;

	for (const pick of picks) {
		message += `
${pick.PickPoints} - ${pick.TeamID ? `${pick.TeamShortName}` : 'Missed Pick'}`;
	}

	message += `
Tiebreaker Score: ${tiebreakerLastScore}`;

	try {
		if (!userResult.UserPhone) {
			throw new Error(`Missing phone number for user ${user.email}!`);
		}

		await sendSMS(userResult.UserPhone, message, "picksSubmitted");
	} catch (error) {
		console.error('Failed to send pick reminder sms: ', {
			error,
			message,
			picks,
			tiebreakerLastScore,
			type: "picksSubmitted",
			user,
			week,
		});
	}
};

export default sendPicksSubmittedSMS;
