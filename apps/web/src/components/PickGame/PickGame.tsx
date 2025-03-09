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
import { faAt } from '@bduff9/pro-duotone-svg-icons';
import { faInfoCircle } from '@bduff9/pro-duotone-svg-icons/faInfoCircle';
import { faTimesCircle } from '@bduff9/pro-duotone-svg-icons/faTimesCircle';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import clsx from 'clsx';
import Image from 'next/image';
import type { FC } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import type { Selectable } from 'kysely';

import { getBackgroundColor } from '../../utils/strings';
import type { LoadingType } from '../MakePicksClient/MakePicksClient';

import styles from './PickGame.module.scss';

import type { Games, Picks, Teams } from '@/db/types';

type DraggablePointProps = {
	index?: number;
	isDragDisabled?: boolean;
	maxValue: number;
	value: number;
};

type PointProps = {
	droppableId?: string;
	isDropDisabled?: boolean;
} & DraggablePointProps;

const DraggablePoint: FC<DraggablePointProps> = ({
	index,
	isDragDisabled = false,
	maxValue,
	value,
}) => {
	return (
		<Draggable
			draggableId={`point-${value}`}
			index={index ?? value}
			isDragDisabled={isDragDisabled}
		>
			{(provided, snapshot) => (
				<div
					className={clsx(
						'd-inline-block',
						'rounded-circle',
						'text-center',
						'pt-1',
						isDragDisabled ? 'cursor-not-allowed' : 'cursor-move',
						styles.point,
						snapshot.isDragging && styles['is-dragging'],
					)}
					ref={provided.innerRef}
					{...provided.draggableProps}
					{...provided.dragHandleProps}
					style={{
						backgroundColor: getBackgroundColor(value, maxValue),
						border: `1px solid ${getBackgroundColor(value, maxValue, '#000')}`,
						...provided.draggableProps.style,
					}}
				>
					{value || ''}
				</div>
			)}
		</Draggable>
	);
};

export const Point: FC<PointProps> = ({
	droppableId,
	index,
	isDragDisabled = false,
	isDropDisabled = false,
	maxValue,
	value,
}) => {
	if (!droppableId) {
		return (
			<DraggablePoint
				index={index}
				isDragDisabled={isDragDisabled}
				maxValue={maxValue}
				value={value}
			/>
		);
	}

	return (
		<Droppable droppableId={droppableId} isDropDisabled={isDropDisabled || !!value}>
			{(provided, snapshot) => (
				<div
					className={clsx(
						'd-inline-block',
						'rounded-circle',
						'text-center',
						'cursor-move',
						styles.point,
						!value && styles.placeholder,
						snapshot.isDraggingOver && styles['dragging-over'],
					)}
					ref={provided.innerRef}
				>
					{!value ? (
						''
					) : (
						<DraggablePoint
							index={index}
							isDragDisabled={isDragDisabled}
							maxValue={maxValue}
							value={value}
						/>
					)}
					{provided.placeholder}
				</div>
			)}
		</Droppable>
	);
};

type PickTeam = Pick<
	Selectable<Teams>,
	'TeamID' | 'TeamCity' | 'TeamLogo' | 'TeamName'
> | null;

type PickGameProps = {
	dragGameID: null | string;
	gameCount: number;
	isBackgrounded?: boolean;
	loading: LoadingType | null;
	onClick: () => void;
	pick: Selectable<Picks> &
		Selectable<Games> & {
			pickTeam: PickTeam;
			homeTeam: PickTeam;
			visitorTeam: PickTeam;
		};
	isSelected?: boolean;
};

const PickGame: FC<PickGameProps> = ({
	dragGameID,
	gameCount,
	isBackgrounded = false,
	isSelected = false,
	loading,
	onClick,
	pick,
}) => {
	const hasStarted = new Date(pick.GameKickoff) < new Date();
	const hasMadePick = !!pick.pickTeam;

	return (
		<div
			className={clsx(
				'row',
				hasMadePick && hasStarted && styles['made-pick-final'],
				hasMadePick && !hasStarted && styles['made-pick'],
				!hasMadePick && hasStarted && styles['missed-pick'],
				isBackgrounded && styles['backgrounded-game'],
			)}
		>
			<div className="col-3 col-md-2 d-flex align-items-center justify-content-end">
				<Point
					droppableId={`visitor-pick-for-game-${pick.GameID}`}
					isDragDisabled={loading !== null || hasStarted}
					isDropDisabled={hasMadePick && dragGameID !== `pick-for-game-${pick.GameID}`}
					maxValue={gameCount}
					value={
						pick.pickTeam?.TeamID === pick.visitorTeam?.TeamID ? pick.PickPoints ?? 0 : 0
					}
				/>
			</div>
			<div className="col-6 col-md-8 d-flex align-items-center text-center">
				<div className={clsx('cursor-pointer', styles['game-info'])} onClick={onClick}>
					<Image
						alt={`${pick.visitorTeam?.TeamCity} ${pick.visitorTeam?.TeamName}`}
						height={60}
						src={`/NFLLogos/${pick.visitorTeam?.TeamLogo}`}
						title={`${pick.visitorTeam?.TeamCity} ${pick.visitorTeam?.TeamName}`}
						width={60}
					/>
					<div className={clsx('d-block', 'd-md-none', styles['team-link'])}>
						{pick.visitorTeam?.TeamName}
					</div>
				</div>
				<div
					className={clsx(
						'd-none',
						'd-md-block',
						'position-relative',
						'cursor-pointer',
						styles['game-info'],
					)}
					onClick={onClick}
				>
					{pick.visitorTeam?.TeamCity}
					<br />
					{pick.visitorTeam?.TeamName}
					{isSelected ? (
						<FontAwesomeIcon
							className="position-absolute top-50 start-0 translate-middle text-danger"
							icon={faTimesCircle}
						/>
					) : (
						<FontAwesomeIcon
							className="position-absolute top-50 start-0 translate-middle"
							icon={faInfoCircle}
						/>
					)}
				</div>
				<div className={clsx(styles['at-symbol'])}>
					<FontAwesomeIcon icon={faAt} />
				</div>
				<div
					className={clsx(
						'd-none',
						'd-md-block',
						'position-relative',
						'cursor-pointer',
						styles['game-info'],
					)}
					onClick={onClick}
				>
					{pick.homeTeam?.TeamCity}
					<br />
					{pick.homeTeam?.TeamName}
					{isSelected ? (
						<FontAwesomeIcon
							className="position-absolute top-50 start-0 translate-middle text-danger"
							icon={faTimesCircle}
						/>
					) : (
						<FontAwesomeIcon
							className="position-absolute top-50 start-0 translate-middle"
							icon={faInfoCircle}
						/>
					)}
				</div>
				<div className={clsx('cursor-pointer', styles['game-info'])} onClick={onClick}>
					<Image
						alt={`${pick.homeTeam?.TeamCity} ${pick.homeTeam?.TeamName}`}
						height={60}
						src={`/NFLLogos/${pick.homeTeam?.TeamLogo}`}
						title={`${pick.homeTeam?.TeamCity} ${pick.homeTeam?.TeamName}`}
						width={60}
					/>
					<div className={clsx('d-block', 'd-md-none', styles['team-link'])}>
						{pick.homeTeam?.TeamName}
					</div>
				</div>
			</div>
			<div className="col-3 col-md-2 d-flex align-items-center justify-content-start">
				<Point
					droppableId={`home-pick-for-game-${pick.GameID}`}
					isDragDisabled={loading !== null || hasStarted}
					isDropDisabled={hasMadePick && dragGameID !== `pick-for-game-${pick.GameID}`}
					maxValue={gameCount}
					value={
						pick.pickTeam?.TeamID === pick.homeTeam?.TeamID ? pick.PickPoints ?? 0 : 0
					}
				/>
			</div>
		</div>
	);
};

export default PickGame;
