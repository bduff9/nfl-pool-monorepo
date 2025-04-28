'use client';
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
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Dropdown from 'react-bootstrap/Dropdown';
import 'client-only';
import type { FC } from 'react';
import { useState } from 'react';

import styles from './viewall.module.scss';

import type { GameForWeek } from '@/actions/game';
import { sortPicks } from '@/utils/arrays';
import type { ViewAllPick } from '@/actions/pick';
import type { WeeklyRank } from '@/actions/weeklyMv';
import ViewAllModal from '@/components/ViewAllModal/ViewAllModal';
import ViewAllTable from '@/components/ViewAllTable/ViewAllTable';

const updateGames = (games: Array<GameForWeek>) => {
	const gamesMap = games.reduce(
		(acc, game) => {
			const gameID = game.GameID;

			if (!acc[gameID]) {
				acc[gameID] = game;
			}

			return acc;
		},
		{} as Record<number, GameForWeek>,
	);

	return gamesMap;
};

type Props = {
	gamesForWeek: Array<GameForWeek>;
	picksForWeek: Array<ViewAllPick>;
	weeklyRankings: Array<WeeklyRank>;
};

const ViewAllPicksClient: FC<Props> = ({
	gamesForWeek,
	picksForWeek,
	weeklyRankings,
}) => {
	const [mode, setMode] = useState<'Live Results' | 'What If'>('Live Results');
	const [games, setGames] = useState<Record<number, GameForWeek>>(
		updateGames(gamesForWeek),
	);
	const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
	const [hasWhatIfBeenSet, setHasWhatIfBeenSet] = useState<boolean>(false);

	const saveModalChanges = (customGames: Array<GameForWeek>): void => {
		setGames(updateGames(customGames));
		setIsModalOpen(false);
		setHasWhatIfBeenSet(true);
	};

	return (
		<>
			<div className="row min-vh-100">
				<div className="col-12 text-center text-md-start">
					Current Viewing Mode
					<br />
					<Dropdown as={ButtonGroup} className={clsx(styles['mode-button'])}>
						<Button
							className={clsx(
								'px-7',
								'text-nowrap',
								'flex-grow-1',
								'flex-shrink-0',
								mode === 'What If' && styles['btn-blue'],
							)}
							disabled={mode === 'Live Results'}
							onClick={() => setIsModalOpen(true)}
							variant={mode === 'Live Results' ? 'primary' : undefined}
						>
							{mode}
						</Button>
						<Dropdown.Toggle
							className={clsx(
								'flex-grow-0',
								'flex-shrink-1',
								mode === 'What If' && styles['btn-blue'],
							)}
							split
							variant={mode === 'Live Results' ? 'primary' : undefined}
						></Dropdown.Toggle>
						<Dropdown.Menu>
							<Dropdown.Item
								onClick={() => {
									setMode('What If');
									setIsModalOpen(true);
								}}
							>
								What If
							</Dropdown.Item>
							<Dropdown.Item
								onClick={() => {
									setMode('Live Results');
									setHasWhatIfBeenSet(false);
									updateGames(gamesForWeek);
								}}
							>
								Live Results
							</Dropdown.Item>
						</Dropdown.Menu>
					</Dropdown>
				</div>
				<div className="col-12">
					{mode === 'Live Results' || !hasWhatIfBeenSet ? (
						<ViewAllTable games={games} picks={picksForWeek} ranks={weeklyRankings} />
					) : (
						<ViewAllTable
							games={games}
							picks={picksForWeek}
							ranks={sortPicks(picksForWeek, games, weeklyRankings)}
						/>
					)}
				</div>
				{mode === 'What If' && (
					<ViewAllModal
						closeModal={() => setIsModalOpen(false)}
						games={gamesForWeek}
						isOpen={isModalOpen}
						saveChanges={saveModalChanges}
					/>
				)}
			</div>
		</>
	);
};

// ts-prune-ignore-next
export default ViewAllPicksClient;
