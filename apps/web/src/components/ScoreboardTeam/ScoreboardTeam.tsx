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
import { faFootballBall } from '@bduff9/pro-duotone-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import clsx from 'clsx';
import Image from 'next/image';
import type { FC } from 'react';

import styles from './ScoreboardTeam.module.scss';

import type { Games_GameStatus, Teams } from '@/db/types';

type ScoreboardTeamProps = {
	gameStatus: Games_GameStatus;
	hasPossession: boolean;
	isInRedzone: boolean;
	isWinner: boolean;
	score: number;
	team: Pick<Teams, 'TeamCity' | 'TeamLogo' | 'TeamName' | 'TeamShortName'> | null;
};

const ScoreboardTeam: FC<ScoreboardTeamProps> = ({
	gameStatus,
	hasPossession,
	isInRedzone,
	isWinner,
	score,
	team,
}) => {
	const isLoser = !isWinner && gameStatus === 'Final';

	if (!team) return null;

	return (
		<>
			<div className="team-logo">
				<Image
					alt={`${team.TeamCity} ${team.TeamName}`}
					className={clsx(isLoser && styles.loser)}
					height={70}
					src={`/NFLLogos/${team.TeamLogo}`}
					title={`${team.TeamCity} ${team.TeamName}`}
					width={70}
					style={{
						maxWidth: '100%',
						height: 'auto',
					}}
				/>
			</div>
			<div
				className={clsx(
					'flex-grow-1',
					'd-flex',
					'align-items-center',
					'ps-3',
					isWinner && 'text-success',
					isWinner && 'fw-bold',
					isLoser && 'text-muted',
					isInRedzone && 'text-danger',
				)}
			>
				<span className="d-none d-md-inline">
					{team.TeamCity} {team.TeamName}
				</span>
				<span className="d-md-none">{team.TeamShortName}</span>
			</div>
			<div
				className={clsx(
					'd-flex',
					'align-items-center',
					'pe-3',
					isWinner && 'text-success',
					isWinner && 'fw-bold',
					isLoser && 'text-muted',
					isInRedzone && 'text-danger',
				)}
			>
				{gameStatus !== 'Pregame' && (
					<>
						{hasPossession && (
							<FontAwesomeIcon
								className={clsx('me-2', !isInRedzone && styles.football)}
								icon={faFootballBall}
							/>
						)}
						{score}
					</>
				)}
			</div>
			<div className="w-100"></div>
		</>
	);
};

export default ScoreboardTeam;
