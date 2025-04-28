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

import MakeSurvivorPickClient from '@/components/MakeSurvivorPickClient/MakeSurvivorPickClient';
import type { NP } from '@/lib/types';
import { getGamesForWeek, getWeekInProgress } from '@/server/loaders/game';
import { getIsAliveInSurvivor, getMySurvivorPicks } from '@/server/loaders/survivor';
import { getTeamsOnBye } from '@/server/loaders/team';
import { getSelectedWeek } from '@/server/loaders/week';
import { redirect } from 'next/navigation';
import CustomHead from '../../../components/CustomHead/CustomHead';

const SetSurvivorPage: NP = async () => {
	const selectedWeekPromise = getSelectedWeek();
	const isAlivePromise = getIsAliveInSurvivor();
	const weekInProgressPromise = getWeekInProgress();
	const survivorPicksPromise = getMySurvivorPicks();

	const [selectedWeek, isAlive, weekInProgress, survivorPicks] = await Promise.all([
		selectedWeekPromise,
		isAlivePromise,
		weekInProgressPromise,
		survivorPicksPromise,
	]);

	const gamesPromise = getGamesForWeek(selectedWeek);
	const teamsOnByePromise = getTeamsOnBye(selectedWeek);

	const [games, teamsOnBye] = await Promise.all([gamesPromise, teamsOnByePromise]);

	if (weekInProgress && selectedWeek <= weekInProgress) {
		return redirect('/survivor/view');
	}

	if (!isAlive) {
		return redirect('/');
	}

	return (
		<div className="h-full flex">
			<CustomHead title="Make Survivor Picks" />
			<div className="bg-gray-100/80 text-black mx-2 pt-5 md:pt-3 min-h-screen pb-4 flex-1">
				<MakeSurvivorPickClient games={games} survivorPicks={survivorPicks} teamsOnBye={teamsOnBye} week={selectedWeek} weekInProgress={weekInProgress} />
			</div>
		</div>
	);
};

export default SetSurvivorPage;
