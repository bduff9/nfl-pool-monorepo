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
import { faTimesHexagon } from '@bduff9/pro-duotone-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import clsx from 'clsx';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '../api/auth/[...nextauth]/authOptions';

import type { NP, TSessionUser } from '@/utils/types';
import CustomHead from '@/components/CustomHead/CustomHead';
import RankingPieChart from '@/components/RankingPieChart/RankingPieChart';
import ProgressChart from '@/components/ProgressChart/ProgressChart';
import { requireRegistered } from '@/utils/auth.server';
import { getSeasonStatus } from '@/loaders/week';
import {
	getMyOverallRank,
	getOverallMvCount,
	getOverallMvTiedCount,
	getOverallRankings,
} from '@/loaders/overallMv';
import {
	OverallDashboardResults,
	OverallDashboardTitle,
} from '@/components/OverallDashboard/OverallDashboard.client';
import { ProgressBarLink } from '@/components/ProgressBar/ProgressBar';

const TITLE = 'Overall Ranks';

// ts-prune-ignore-next
export const metadata: Metadata = {
	title: TITLE,
};

const OverallRankings: NP = async () => {
	if (await requireRegistered()) {
		return null;
	}

	const sessionPromise = getServerSession(authOptions);
	const seasonStatusPromise = getSeasonStatus();
	const myOverallRankPromise = getMyOverallRank();
	const overallTotalCountPromise = getOverallMvCount();
	const overallTiedCountPromise = getOverallMvTiedCount();
	const overallRankingsPromise = getOverallRankings();

	const [
		session,
		seasonStatus,
		myOverallRank,
		overallTotalCount,
		overallTiedCount,
		overallRankings,
	] = await Promise.all([
		sessionPromise,
		seasonStatusPromise,
		myOverallRankPromise,
		overallTotalCountPromise,
		overallTiedCountPromise,
		overallRankingsPromise,
	]);

	if (overallTotalCount === 0) {
		redirect('/');

		return null;
	}

	const myPlace = `${myOverallRank?.Tied ? 'T' : ''}${myOverallRank?.Rank}`;
	const me = myOverallRank?.Rank ?? 0;
	const aheadOfMe = me - 1;
	const behindMe = overallTotalCount - me - overallTiedCount;

	return (
		<div className="h-100 row">
			<CustomHead title={TITLE} />
			<div className="content-bg text-dark my-3 mx-2 pt-0 pt-md-3 min-vh-100 pb-4 col">
				<div className="row">
					<div
						className="d-none d-md-inline-block col-6 text-center"
						style={{ height: '205px' }}
					>
						<OverallDashboardTitle />
						<RankingPieChart
							data={[
								{
									fill: 'var(--bs-danger)',
									myPlace,
									name: 'ahead of me',
									total: overallTotalCount,
									value: aheadOfMe,
								},
								{
									fill: 'var(--bs-success)',
									myPlace,
									name: 'behind me',
									total: overallTotalCount,
									value: behindMe,
								},
								{
									fill: 'var(--bs-warning)',
									myPlace,
									name: 'tied with me',
									total: overallTotalCount,
									value: overallTiedCount,
								},
							]}
							layoutId="overallRankingPieChart"
						/>
					</div>
					<div className="mt-4 d-block d-md-none">
						<ProgressBarLink href="/">&laquo; Back to Dashboard</ProgressBarLink>
					</div>
					<div className="d-none d-md-inline-block col-6">
						<OverallDashboardResults className="mb-4 text-center" />
						<ProgressChart
							correct={myOverallRank?.PointsEarned ?? 0}
							incorrect={myOverallRank?.PointsWrong ?? 0}
							isOver={seasonStatus === 'Complete'}
							layoutId="overallPointsEarned"
							max={myOverallRank?.PointsTotal ?? 0}
							type="Points"
						/>
						<ProgressChart
							correct={myOverallRank?.GamesCorrect ?? 0}
							incorrect={myOverallRank?.GamesWrong ?? 0}
							isOver={seasonStatus === 'Complete'}
							layoutId="overallGamesCorrect"
							max={myOverallRank?.GamesTotal ?? 0}
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
									<th scope="col">Missed Games?</th>
								</tr>
							</thead>
							<tbody>
								{overallRankings.map(row => (
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
										<td
											className="text-danger"
											title={`Missed games: ${row.GamesMissed}`}
										>
											{row.GamesMissed > 0 && (
												<FontAwesomeIcon className="text-danger" icon={faTimesHexagon} />
											)}
										</td>
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
export default OverallRankings;
