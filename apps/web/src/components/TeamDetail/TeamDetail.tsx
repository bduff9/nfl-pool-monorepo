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
import { faTimesCircle } from '@bduff9/pro-duotone-svg-icons/faTimesCircle';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import clsx from 'clsx';
import type { FC } from 'react';
import type { Selectable } from 'kysely';

import styles from './TeamDetail.module.scss';

import type { Games, Teams } from '@/db/types';

type TeamBlockProps = {
	onClose?: () => void;
	spread?: null | number;
	team:
		| (Pick<
				Selectable<Teams>,
				| 'TeamCity'
				| 'TeamID'
				| 'TeamLogo'
				| 'TeamName'
				| 'TeamPrimaryColor'
				| 'TeamSecondaryColor'
				| 'TeamConference'
				| 'TeamDivision'
				| 'TeamPassDefenseRank'
				| 'TeamPassOffenseRank'
				| 'TeamRushDefenseRank'
				| 'TeamRushOffenseRank'
		  > & {
				record: { losses: number; ties: number; wins: number } | null;
				teamHistory: (Pick<
					Selectable<Games>,
					| 'GameID'
					| 'GameWeek'
					| 'HomeTeamID'
					| 'VisitorTeamID'
					| 'WinnerTeamID'
					| 'GameHomeScore'
					| 'GameVisitorScore'
				> & {
					homeTeamShortName: string;
					visitorTeamShortName: string;
				})[];
		  })
		| null;
};

const TeamBlock: FC<TeamBlockProps> = ({ onClose, spread, team }) => (
	<div className={clsx('col-6')}>
		<div
			className={clsx(
				'position-relative',
				'border',
				'border-dark',
				'rounded',
				'p-3',
				styles['team-wrapper'],
			)}
		>
			{onClose && (
				<FontAwesomeIcon
					className="position-absolute top-0 end-0 mt-1 me-1 d-inline-block d-md-none text-danger"
					icon={faTimesCircle}
					onClick={onClose}
				/>
			)}
			<h4 className="text-center">
				<u
					style={{
						color: team?.TeamPrimaryColor,
						textDecorationColor: team?.TeamSecondaryColor,
					}}
				>
					{team?.TeamCity} {team?.TeamName}
				</u>
			</h4>
			<div className="row">
				<div className="col-12 col-md-6 text-start">Record:</div>
				<div className="col-12 col-md-6 text-start text-md-end">
					{team?.record?.wins ?? 0}-{team?.record?.losses ?? 0}-{team?.record?.ties ?? 0}
				</div>
			</div>
			<div className="row">
				<div className="col-12 col-md-6 text-start">Division:</div>
				<div className="col-12 col-md-6 text-start text-md-end">
					{`${team?.TeamConference} ${team?.TeamDivision}`}
				</div>
			</div>

			<div className="row">
				<div className="col-12 col-md-6 text-start">Spread:</div>
				<div className="col-12 col-md-6 text-start text-md-end">{spread}</div>
			</div>

			<h5 className="mt-2 text-center">Rankings</h5>
			<div className="row">
				<div className="col-12 col-md-6 text-start">Rushing Offense:</div>
				<div className="col-12 col-md-6 text-start text-md-end">
					{team?.TeamRushOffenseRank}
				</div>
			</div>
			<div className="row">
				<div className="col-12 col-md-6 text-start">Passing Offense:</div>
				<div className="col-12 col-md-6 text-start text-md-end">
					{team?.TeamPassOffenseRank}
				</div>
			</div>
			<div className="row">
				<div className="col-12 col-md-6 text-start">Rushing Defense:</div>
				<div className="col-12 col-md-6 text-start text-md-end">
					{team?.TeamRushDefenseRank}
				</div>
			</div>
			<div className="row">
				<div className="col-12 col-md-6 text-start">Passing Defense:</div>
				<div className="col-12 col-md-6 text-start text-md-end">
					{team?.TeamPassDefenseRank}
				</div>
			</div>
			{(team?.teamHistory?.length ?? 0) > 0 && (
				<h5 className="mt-2 text-center">History</h5>
			)}
			{team?.teamHistory.map(game => {
				const won = game.WinnerTeamID === team.TeamID;
				const isHome = game.HomeTeamID === team.TeamID;
				const lost = isHome
					? game.WinnerTeamID === game.VisitorTeamID
					: game.WinnerTeamID === game.HomeTeamID;

				return (
					<div className="row" key={`history-for-game-${game.GameID}`}>
						<div className="col-12 col-md-6 text-start">
							Wk {game.GameWeek} {isHome ? 'vs' : '@'}{' '}
							{isHome ? game.visitorTeamShortName : game.homeTeamShortName}
						</div>
						<div
							className={clsx(
								'col-12',
								'col-md-6',
								'text-start',
								'text-md-end',
								won && 'text-success',
								lost && 'text-danger',
							)}
						>
							{won ? 'W' : lost ? 'L' : 'T'} (
							{isHome ? game.GameHomeScore : game.GameVisitorScore}-
							{isHome ? game.GameVisitorScore : game.GameHomeScore})
						</div>
					</div>
				);
			})}
		</div>
	</div>
);

type TeamDetailProps = {
	game: Selectable<Games> & {
		homeTeam:
			| (Pick<
					Selectable<Teams>,
					| 'TeamCity'
					| 'TeamID'
					| 'TeamLogo'
					| 'TeamName'
					| 'TeamPrimaryColor'
					| 'TeamSecondaryColor'
					| 'TeamConference'
					| 'TeamDivision'
					| 'TeamPassDefenseRank'
					| 'TeamPassOffenseRank'
					| 'TeamRushDefenseRank'
					| 'TeamRushOffenseRank'
			  > & {
					record: { losses: number; ties: number; wins: number } | null;
					teamHistory: (Selectable<Games> & {
						homeTeamShortName: string;
						visitorTeamShortName: string;
					})[];
			  })
			| null;
		visitorTeam:
			| (Pick<
					Selectable<Teams>,
					| 'TeamCity'
					| 'TeamID'
					| 'TeamLogo'
					| 'TeamName'
					| 'TeamPrimaryColor'
					| 'TeamSecondaryColor'
					| 'TeamConference'
					| 'TeamDivision'
					| 'TeamPassDefenseRank'
					| 'TeamPassOffenseRank'
					| 'TeamRushDefenseRank'
					| 'TeamRushOffenseRank'
			  > & {
					record: { losses: number; ties: number; wins: number } | null;
					teamHistory: (Pick<
						Selectable<Games>,
						| 'GameID'
						| 'GameWeek'
						| 'HomeTeamID'
						| 'VisitorTeamID'
						| 'WinnerTeamID'
						| 'GameHomeScore'
						| 'GameVisitorScore'
					> & {
						homeTeamShortName: string;
						visitorTeamShortName: string;
					})[];
			  })
			| null;
	};
	onClose?: () => void;
};

const TeamDetail: FC<TeamDetailProps> = ({ game, onClose }) => {
	return (
		<div className="row">
			<TeamBlock
				onClose={onClose}
				spread={Number(game.GameVisitorSpread)}
				team={game.visitorTeam}
			/>
			<TeamBlock
				onClose={onClose}
				spread={Number(game.GameHomeSpread)}
				team={game.homeTeam}
			/>
		</div>
	);
};

export default TeamDetail;
