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
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { authOptions } from '../api/auth/[...nextauth]/authOptions';

import type { NP, TSessionUser } from '@/utils/types';
import { requireRegistered } from '@/utils/auth.server';
import { getSelectedWeek, getWeekStatus } from '@/loaders/week';
import CustomHead from '@/components/CustomHead/CustomHead';
import {
	getWeeklyMvCount,
	getWeeklyMvTiedCount,
	getMyWeeklyRank,
	getWeeklyRankings,
} from '@/loaders/weeklyMv';
import RankingPieChart from '@/components/RankingPieChart/RankingPieChart';
import ProgressChart from '@/components/ProgressChart/ProgressChart';
import {
	WeeklyDashboardResults,
	WeeklyDashboardTitle,
} from '@/components/WeeklyDashboard/WeeklyDashboard.client';
import { ProgressBarLink } from '@/components/ProgressBar/ProgressBar';

const TITLE = 'Weekly Ranks';

// ts-prune-ignore-next
export const metadata: Metadata = {
	title: TITLE,
};

const WeeklyRankings: NP = async () => {
	if (await requireRegistered()) {
		return null;
	}

	const selectedWeek = await getSelectedWeek();

	const sessionPromise = getServerSession(authOptions);
	const weekStatusPromise = getWeekStatus(selectedWeek);
	const weeklyTotalCountPromise = getWeeklyMvCount(selectedWeek);
	const weeklyTiedCountPromise = getWeeklyMvTiedCount(selectedWeek);
	const myWeeklyRankPromise = getMyWeeklyRank(selectedWeek);
	const weeklyRankingsPromise = getWeeklyRankings(selectedWeek);

	const [
		session,
		weekStatus,
		weeklyTotalCount,
		weeklyTiedCount,
		myWeeklyRank,
		weeklyRankings,
	] = await Promise.all([
		sessionPromise,
		weekStatusPromise,
		weeklyTotalCountPromise,
		weeklyTiedCountPromise,
		myWeeklyRankPromise,
		weeklyRankingsPromise,
	]);

	if (weeklyTotalCount === 0) {
		redirect('/');

		return null;
	}

	const myPlace = `${myWeeklyRank?.Tied ? 'T' : ''}${myWeeklyRank?.Rank}`;
	const me = myWeeklyRank?.Rank ?? 0;
	const aheadOfMe = me - 1;
	const behindMe = weeklyTotalCount - me - weeklyTiedCount;

	return (
		<div className="h-100 row">
			<CustomHead title={`Week ${selectedWeek} Ranks`} />
			<div className="content-bg text-dark my-3 mx-2 pt-0 pt-md-3 min-vh-100 pb-4 col">
				<div className="row">
					<div
						className="d-none d-md-inline-block col-6 text-center"
						style={{ height: '205px' }}
					>
						<WeeklyDashboardTitle selectedWeek={selectedWeek} />
						<RankingPieChart
							data={[
								{
									fill: 'var(--bs-danger)',
									myPlace,
									name: 'ahead of me',
									total: weeklyTotalCount,
									value: aheadOfMe,
								},
								{
									fill: 'var(--bs-success)',
									myPlace,
									name: 'behind me',
									total: weeklyTotalCount,
									value: behindMe,
								},
								{
									fill: 'var(--bs-warning)',
									myPlace,
									name: 'tied with me',
									total: weeklyTotalCount,
									value: weeklyTiedCount,
								},
							]}
							layoutId="weeklyRankingPieChart"
						/>
					</div>
					<div className="mt-4 d-block d-md-none">
						<ProgressBarLink href="/">&laquo; Back to Dashboard</ProgressBarLink>
					</div>
					<div className="d-none d-md-inline-block col-6">
						<WeeklyDashboardResults
							className="mb-4 text-center"
							selectedWeek={selectedWeek}
						/>
						<ProgressChart
							correct={myWeeklyRank?.PointsEarned ?? 0}
							incorrect={myWeeklyRank?.PointsWrong ?? 0}
							isOver={weekStatus === 'Complete'}
							layoutId="weeklyPointsEarned"
							max={myWeeklyRank?.PointsTotal ?? 0}
							type="Points"
						/>
						<ProgressChart
							correct={myWeeklyRank?.GamesCorrect ?? 0}
							incorrect={myWeeklyRank?.GamesWrong ?? 0}
							isOver={weekStatus === 'Complete'}
							layoutId="weeklyGamesCorrect"
							max={myWeeklyRank?.GamesTotal ?? 0}
							type="Games"
						/>
					</div>
					<div className="col-12 mt-4 table-responsive text-center">
						<table className="table table-striped table-hover">
							<thead>
								<tr>
									<th scope="col">Rank</th>
									<th scope="col">Team</th>
									<th scope="col">Owner</th>
									<th scope="col">Points</th>
									<th scope="col">Games Correct</th>
									<th scope="col">Tiebreaker</th>
									<th scope="col">Last Game</th>
									<th scope="col">Eliminated</th>
								</tr>
							</thead>
							<tbody>
								{weeklyRankings.map(row => (
									<tr
										className={clsx(
											row.newUserID === (session?.user as TSessionUser)?.id &&
												'table-warning',
										)}
										key={`user-rank-for-${row.newUserID}`}
									>
										<th scope="row">
											{row.Tied ? 'T' : ''}
											{row.Rank}
										</th>
										<td>{row.TeamName}</td>
										<td>{row.UserName}</td>
										<td>{row.PointsEarned}</td>
										<td>{row.GamesCorrect}</td>
										<td>{row.TiebreakerScore}</td>
										<td>{row.LastScore}</td>
										<td className="text-danger">{row.IsEliminated === 1 && <b>X</b>}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
};

// ts-prune-ignore-next
export default WeeklyRankings;
