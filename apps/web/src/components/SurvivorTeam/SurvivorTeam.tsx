'use client';
import { Badge } from '@nfl-pool-monorepo/ui/components/badge';
import { cn } from '@nfl-pool-monorepo/utils/styles';
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
import type { getMySurvivorPicks } from '@/server/loaders/survivor';
import type { getTeamsOnBye } from '@/server/loaders/team';
import 'client-only';
import Image from 'next/image';
import type { FC } from 'react';
import { PiFootballDuotone } from 'react-icons/pi';

type Props = {
	isHome?: boolean;
	isOnBye?: boolean;
	loading?: null | number;
	onClick?: () => void;
	pick: Awaited<ReturnType<typeof getMySurvivorPicks>>[number] | undefined;
	team: Awaited<ReturnType<typeof getTeamsOnBye>>[number] | null;
	weekInProgress: number | null;
};

const SurvivorTeam: FC<Props> = ({
	isHome = false,
	isOnBye = false,
	loading,
	onClick,
	pick,
	team,
	weekInProgress,
}) => {
	return (
		<div
			className={cn(
				...(pick
					? [
						'cursor-default pointer-events-none border-4',
						pick.SurvivorPickWeek < (weekInProgress ?? 0) && 'text-green-800 border-green-400 bg-green-200',
						pick.SurvivorPickWeek === (weekInProgress ?? 0) && 'text-blue-800 border-blue-400 bg-blue-200',
						pick.SurvivorPickWeek > (weekInProgress ?? 0) && 'text-yellow-800 border-yellow-400 bg-yellow-200',
					]
					: isOnBye
						? 'border border-black bg-gray-100'
						: [
							'border-b border-e border-black bg-gray-100 hover:bg-blue-200 hover:border-blue-400 hover:border-4',
							loading ? 'pointer-events-none bg-gray-300 grayscale' : 'cursor-pointer',
							!isHome && 'border-s',
						]),
				'relative p-2 text-center h-[152px] flex flex-col items-center justify-center',
				isOnBye ? 'w-1/2 md:w-1/4 lg:w-1/6' : 'w-1/2',
			)}
			onClick={!pick ? onClick : undefined}
			onKeyDown={(event) => {
				if (event.key === 'Enter' || event.key === ' ') {
					!pick && onClick?.();
				}
			}}
		>
			{!!pick && (
				<Badge
					className={cn(
						'rounded-full absolute top-0 start-0',
					)}
					variant={pick.SurvivorPickWeek < (weekInProgress ?? 0) ? 'success' : pick.SurvivorPickWeek === (weekInProgress ?? 0) ? 'blue' : 'warning'}
				>
					{pick.SurvivorPickWeek}
				</Badge>
			)}
			<Image
				alt={`${team?.TeamCity} ${team?.TeamName}`}
				height={70}
				layout="intrinsic"
				src={`/NFLLogos/${team?.TeamLogo}`}
				title={`${team?.TeamCity} ${team?.TeamName}`}
				width={70}
			/>
			<br />
			{loading === team?.TeamID && (
				<PiFootballDuotone
													aria-hidden="true"
													className="animate-spin"
												/>
			)}
			<span className="hidden md:inline">
				{team?.TeamCity}
				<br />
			</span>
			{team?.TeamName}
		</div>
	);
};

export default SurvivorTeam;
