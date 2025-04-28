/*******************************************************************************
 * NFL Confidence Pool FE - the frontend implementation of an NFL confidence pool.
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
import clsx from 'clsx';
import 'server-only';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import ViewAllPicksClient from './viewall.client';

import type { NP } from '@/utils/types';
import { getSelectedWeek } from '@/loaders/week';
import { requireRegistered } from '@/utils/auth.server';
import { getMyTiebreaker } from '@/loaders/tiebreaker';
import CustomHead from '@/components/CustomHead/CustomHead';
import { getWeeklyRankings } from '@/loaders/weeklyMv';
import { getGamesForWeek } from '@/loaders/game';
import { getAllPicksForWeek } from '@/loaders/pick';

const TITLE = 'View All Week Picks';

// ts-prune-ignore-next
export const metadata: Metadata = {
	title: TITLE,
};

const ViewAllPicks: NP = async () => {
	if (await requireRegistered()) {
		return null;
	}

	const selectedWeek = await getSelectedWeek();
	const tiebreakerPromise = getMyTiebreaker(selectedWeek);
	const weeklyRankingsPromise = getWeeklyRankings(selectedWeek);
	const gamesForWeekPromise = getGamesForWeek(selectedWeek);
	const picksForWeekPromise = getAllPicksForWeek(selectedWeek);

	const [tiebreaker, weeklyRankings, gamesForWeek, picksForWeek] = await Promise.all([
		tiebreakerPromise,
		weeklyRankingsPromise,
		gamesForWeekPromise,
		picksForWeekPromise,
	]);

	if (!tiebreaker.TiebreakerHasSubmitted) {
		return redirect('/picks/set');
	}

	if (weeklyRankings.length === 0) {
		return redirect('/picks/view');
	}

	return (
		<div className="h-100 row">
			<CustomHead title={`View all week ${selectedWeek} picks`} />
			<div
				className={clsx(
					'content-bg',
					'text-dark',
					'my-3',
					'mx-2',
					'pt-3',
					'col',
					'min-vh-100',
				)}
			>
				<ViewAllPicksClient
					gamesForWeek={gamesForWeek}
					picksForWeek={picksForWeek}
					weeklyRankings={weeklyRankings}
					key={`view-all-for-week-${selectedWeek}`}
				/>
			</div>
		</div>
	);
};

// ts-prune-ignore-next
export default ViewAllPicks;
