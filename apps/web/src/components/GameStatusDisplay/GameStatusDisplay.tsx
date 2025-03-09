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
import type { FC } from 'react';

import { formatTimeFromKickoff } from '../../utils/dates';
import { getShortQuarter } from '../../utils/strings';

import type { Games_GameStatus } from '@/db/types';

type GameStatusDisplayProps = {
	kickoff: Date;
	status: Games_GameStatus;
	timeLeft: string;
};

const GameStatusDisplay: FC<GameStatusDisplayProps> = ({ kickoff, status, timeLeft }) => {
	if (status === 'Final') {
		return <>{status}</>;
	}

	if (status === 'Pregame') {
		return <>{formatTimeFromKickoff(kickoff)}</>;
	}

	return (
		<>
			<span className="d-none d-md-inline">{status}</span>
			<span className="d-md-none">{getShortQuarter(status)}</span>
			{status !== 'Half Time' && (
				<>
					<br />
					{timeLeft}
				</>
			)}
		</>
	);
};

export default GameStatusDisplay;
