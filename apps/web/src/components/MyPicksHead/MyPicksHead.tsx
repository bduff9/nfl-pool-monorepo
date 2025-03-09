import type { FC } from 'react';

import MyProgressChart from '../MyProgressChart/MyProgressChart';

import { getWeekStatus } from '@/loaders/week';
import { getMyWeeklyRank } from '@/loaders/weeklyMv';

type Props = {
	week: number;
};

const MyPicksHead: FC<Props> = async ({ week }) => {
	const weekStatusPromise = getWeekStatus(week);
	const myWeeklyRankPromise = getMyWeeklyRank(week);

	const [weekStatus, myWeeklyRank] = await Promise.all([
		weekStatusPromise,
		myWeeklyRankPromise,
	]);

	if (!myWeeklyRank) {
		return null;
	}

	return (
		<>
			<div className="col-12 col-md-4 pb-3">
				<div className="content-bg rounded px-3 pt-2 h-100">
					<h5 className="text-center mb-0">Current Score</h5>
					<MyProgressChart
						correct={myWeeklyRank.PointsEarned}
						correctLabel="Your Current Score"
						isOver={weekStatus === 'Complete'}
						max={myWeeklyRank.PointsTotal}
						maxLabel="Max Score"
						possible={myWeeklyRank.PointsPossible}
						possibleLabel="Your Max Possible Score"
					/>
				</div>
			</div>
			<div className="col-12 col-md-4 pb-3">
				<div className="content-bg rounded px-3 pt-2 h-100">
					<h5 className="text-center mb-0">Games Correct</h5>
					<MyProgressChart
						correct={myWeeklyRank.GamesCorrect}
						correctLabel="Your Correct Games"
						isOver={weekStatus === 'Complete'}
						max={myWeeklyRank.GamesTotal}
						maxLabel="Max Games"
						possible={myWeeklyRank.GamesPossible}
						possibleLabel="Your Max Possible Games"
					/>
				</div>
			</div>
			<div className="col-6 col-md-2 pb-3">
				<div className="content-bg rounded text-center px-3 pt-2 h-100">
					<h5 className="px-2" style={{ height: '3rem' }}>
						My Tiebreaker
					</h5>
					<div className="h1">{myWeeklyRank.TiebreakerScore}</div>
				</div>
			</div>
			<div className="col-6 col-md-2 pb-3">
				<div className="content-bg rounded text-center px-3 pt-2 h-100">
					<h5 style={{ height: '3rem' }}>Final Game Total</h5>
					<div className="h1">{myWeeklyRank.LastScore}</div>
				</div>
			</div>
		</>
	);
};

export default MyPicksHead;
