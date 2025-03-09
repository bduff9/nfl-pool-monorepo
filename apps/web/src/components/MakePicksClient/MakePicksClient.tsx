'use client';
import type { FC, FocusEventHandler } from 'react';
// eslint-disable-next-line import/named
import { Fragment, useCallback, useOptimistic, useState, useTransition } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRedo } from '@bduff9/pro-duotone-svg-icons/faRedo';
import { faUserRobot } from '@bduff9/pro-duotone-svg-icons/faUserRobot';
import { faSave } from '@bduff9/pro-duotone-svg-icons/faSave';
import { faCloudUpload } from '@bduff9/pro-duotone-svg-icons/faCloudUpload';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import Dropdown from 'react-bootstrap/Dropdown';
import { SkeletonTheme } from 'react-loading-skeleton';
import clsx from 'clsx';
import 'client-only';
import dynamic from 'next/dynamic';
import type { DropResult, DragStart } from '@hello-pangea/dnd';
import { toast } from 'react-toastify';
import type { Selectable } from 'kysely';

import TeamDetail from '../TeamDetail/TeamDetail';
import PickGame, { Point } from '../PickGame/PickGame';
import { parseDragData } from '../../utils/strings';
import { ErrorIcon, SuccessIcon } from '../ToastUtils/ToastIcons';
import { logger } from '../../utils/logging';

import styles from './MakePicksClient.module.scss';

import { Users_UserAutoPickStrategy } from '@/db/types';
import type { Teams, Picks, Tiebreakers, Games } from '@/db/types';
import {
	autoPickMyPicks,
	resetMyPicksForWeek,
	setMyPick,
	submitMyPicks,
	validateMyPicks,
} from '@/actions/pick';
import { updateMyTiebreakerScore } from '@/actions/tiebreaker';

const ConfirmationModal = dynamic(
	() => import('../ConfirmationModal/ConfirmationModal'),
	{ ssr: false },
);

export type LoadingType = 'autopick' | 'reset' | 'save' | 'submit';

type Props = {
	selectedWeek: number;
	tiebreaker: Selectable<Tiebreakers>;
	weeklyPicks: (Selectable<Picks> &
		Selectable<Games> & {
			pickTeam: Pick<
				Selectable<Teams>,
				'TeamCity' | 'TeamID' | 'TeamLogo' | 'TeamName'
			> | null;
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
		})[];
};

const MakePicksClient: FC<Props> = ({ selectedWeek, tiebreaker, weeklyPicks }) => {
	const [selectedGame, setSelectedGame] = useState<null | number>(null);
	const [dragGameID, setDragGameID] = useState<null | string>(null);
	const [tiebreakerLastScoreError, setTiebreakerLastScoreError] = useState<null | string>(
		null,
	);
	const [optimisticPicks, setOptimisticPicks] = useOptimistic(weeklyPicks);
	const [picksUpdating, startPicksUpdating] = useTransition();
	const [loading, setLoading] = useState<LoadingType | null>(null);
	const [callback, setCallback] = useState<{
		acceptButton: string;
		body: string | JSX.Element;
		onAccept: () => Promise<void>;
		title: string;
	} | null>(null);
	const lastGame = optimisticPicks[optimisticPicks.length - 1];

	const onDragEnd = useCallback(
		(result: DropResult): void => {
			const { draggableId, source, destination } = result;

			setDragGameID(null);

			if (!destination) {
				return;
			}

			if (source.droppableId === destination.droppableId) {
				return;
			}

			const [points, sourceData, destinationData] = parseDragData(
				draggableId,
				source.droppableId,
				destination.droppableId,
			);
			const gameID = destinationData?.gameID ?? null;
			const pick = optimisticPicks.find(pick => pick.GameID === gameID);
			const pickTeam =
				destinationData?.type === 'home'
					? pick?.homeTeam ?? null
					: destinationData?.type === 'visitor'
						? pick?.visitorTeam ?? null
						: null;

			startPicksUpdating(async () => {
				setOptimisticPicks(
					optimisticPicks.map(pick => {
						if (pick.GameKickoff < new Date()) {
							return pick;
						}

						if (gameID === pick.GameID) {
							return {
								...pick,
								PickPoints: points,
								TeamID: pickTeam?.TeamID ?? null,
								pickTeam,
							};
						}

						if (points === pick.PickPoints) {
							return {
								...pick,
								PickPoints: null,
								TeamID: null,
								pickTeam: null,
							};
						}

						return pick;
					}),
				);

				const result = await setMyPick(
					selectedWeek,
					gameID,
					pickTeam?.TeamID ?? null,
					points,
				);

				if (result.status === 'ERROR') {
					logger.error({
						text: 'Error setting user pick',
						destinationData,
						result,
						points,
						sourceData,
						pickTeam,
					});

					toast.error(result.message || 'Something went wrong, please try again', {
						icon: ErrorIcon,
					});
				}
			});
		},
		[optimisticPicks, selectedWeek, setOptimisticPicks],
	);

	const onDragStart = useCallback((initial: DragStart): void => {
		const {
			source: { droppableId },
		} = initial;

		setDragGameID(droppableId.replace('home-', '').replace('visitor-', ''));
	}, []);

	const used = optimisticPicks
		.map((pick): number => (pick.PickPoints && pick.pickTeam ? pick.PickPoints : 0))
		.filter(point => point > 0);
	const unavailable = optimisticPicks
		.map((pick): number => {
			const kickoff = pick.GameKickoff;
			const now = new Date();

			if (!pick.pickTeam && now.getTime() > kickoff.getTime()) {
				return pick.PickPoints ?? 0;
			}

			return 0;
		})
		.filter(point => point > 0);
	const allUsed = used.concat(unavailable);
	const available: Array<number> = [];

	for (let i = 1; i <= optimisticPicks.length; i++) {
		if (!allUsed.includes(i)) available.push(i);
	}

	const updateTiebreakerScore: FocusEventHandler<HTMLInputElement> = async event => {
		const tiebreakerLastScore = +event.currentTarget.value;

		if (Number.isNaN(tiebreakerLastScore)) {
			setTiebreakerLastScoreError('Please enter a valid number');

			return;
		}

		if (tiebreakerLastScore < 1) {
			setTiebreakerLastScoreError('Tiebreaker score must be greater than 0');

			return;
		}

		setTiebreakerLastScoreError(null);

		startPicksUpdating(async () => {
			const result = await updateMyTiebreakerScore(selectedWeek, tiebreakerLastScore);

			if (result.status === 'ERROR') {
				logger.error({
					text: 'Error updating tiebreakerLastScore',
					result,
					selectedWeek,
					tiebreakerLastScore,
				});

				toast.error(result.message || 'Something went wrong, please try again', {
					icon: ErrorIcon,
				});
			}
		});
	};

	const resetPicks = async (): Promise<void> => {
		setLoading('reset');
		startPicksUpdating(async () => {
			setOptimisticPicks(
				optimisticPicks.map(pick => {
					if (pick.GameKickoff > new Date()) {
						return {
							...pick,
							PickPoints: null,
							pickTeam: null,
							TeamID: null,
						};
					}

					return pick;
				}),
			);

			const result = await resetMyPicksForWeek(selectedWeek);

			if (result.status === 'ERROR') {
				logger.error({
					text: 'Error resetting user picks',
					result,
					selectedWeek,
				});

				toast.error(result.message || 'Something went wrong, please try again', {
					icon: ErrorIcon,
				});
			} else if (result.status === 'SUCCESS') {
				toast.success(`Successfully reset your picks for week ${selectedWeek}`, {
					icon: SuccessIcon,
				});
			}

			setLoading(null);
			setCallback(null);
		});
	};

	const autoPick = async (type: Users_UserAutoPickStrategy): Promise<void> => {
		try {
			setLoading('autopick');
			// setPicksUpdating(true);

			await toast.promise(autoPickMyPicks(selectedWeek, type), {
				error: {
					icon: ErrorIcon,
					render({ data }) {
						logger.debug({ text: '~~~~~~~ERROR DATA: ', data });

						return 'Something went wrong, please try again';
					},
				},
				pending: 'Auto picking...',
				success: {
					icon: SuccessIcon,
					render() {
						return `Successfully auto picked your picks for week ${selectedWeek}`;
					},
				},
			});
		} catch (error) {
			logger.error({
				text: 'Error auto picking user picks',
				error,
				selectedWeek,
			});
		} finally {
			// setPicksUpdating(false);
			setLoading(null);
		}
	};

	const savePicks = async (): Promise<void> => {
		try {
			setLoading('save');
			// setPicksUpdating(true);

			await toast.promise(
				validateMyPicks(selectedWeek, available, tiebreaker.TiebreakerLastScore ?? 0),
				{
					error: {
						icon: ErrorIcon,
						render({ data }) {
							logger.debug({ text: '~~~~~~~ERROR DATA: ', data });

							return 'Something went wrong, please try again';
						},
					},
					pending: 'Saving...',
					success: {
						icon: SuccessIcon,
						render() {
							return (
								<>
									<div className="mb-3">
										Successfully saved your picks for week {selectedWeek}!
									</div>
									<div>
										Please note that you will still need to submit your picks when ready
										as they are only saved, not submitted.
									</div>
								</>
							);
						},
					},
				},
			);
		} catch (error) {
			logger.error({ text: 'Error saving user picks', error, selectedWeek });
		} finally {
			// setPicksUpdating(false);
			setLoading(null);
		}
	};

	const submitPicks = async (): Promise<void> => {
		try {
			setLoading('submit');
			// setPicksUpdating(true);

			if (available.length > 0) {
				toast.error(
					'Missing point value found! Please use all points before submitting',
					{
						icon: ErrorIcon,
					},
				);

				return;
			}

			const lastGameHasStarted = lastGame.GameKickoff < new Date();

			if ((tiebreaker.TiebreakerLastScore ?? 0) < 1 && !lastGameHasStarted) {
				toast.error('Tiebreaker last score must be greater than zero', {
					icon: ErrorIcon,
				});

				return;
			}

			await toast.promise(submitMyPicks(selectedWeek), {
				error: {
					icon: ErrorIcon,
					render({ data }) {
						logger.debug({ text: '~~~~~~~ERROR DATA: ', data });

						return 'Something went wrong, please try again';
					},
				},
				pending: 'Submitting...',
				success: {
					icon: SuccessIcon,
					render() {
						return `Successfully submitted your picks for week ${selectedWeek}`;
					},
				},
			});

			// setPicksUpdating(false);
		} catch (error) {
			logger.error({
				text: 'Error submitting user picks',
				error,
				selectedWeek,
			});
		} finally {
			// setPicksUpdating(false);
			setLoading(null);
			setCallback(null);
		}
	};

	return (
		<SkeletonTheme>
			<div className="row min-vh-100">
				<h4 className="col-12 mb-3 text-center flex-shrink-1">
					Drag points to your chosen winning team or click a team to see the game details
				</h4>
				<DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
					<Droppable droppableId="pointBank" direction="horizontal">
						{(provided, snapshot) => (
							<div
								className={clsx(
									'col-12',
									'd-flex',
									'flex-wrap',
									'justify-content-start',
									'align-items-center',
									'p-3',
									'mb-3',
									'sticky-top',
									styles['point-bank'],
									snapshot.isDraggingOver && styles['dragging-over'],
								)}
								ref={provided.innerRef}
							>
								{available.map((point, index) => (
									<Point
										index={index}
										isDragDisabled={loading !== null}
										key={`point-${point}`}
										maxValue={optimisticPicks.length}
										value={point}
									/>
								))}
								{provided.placeholder}
							</div>
						)}
					</Droppable>
					<div className="col-12 mb-3">
						{optimisticPicks.map(pick => (
							<Fragment key={`pick-id-${pick.PickID}`}>
								<PickGame
									dragGameID={dragGameID}
									gameCount={optimisticPicks.length}
									isBackgrounded={!!selectedGame && pick.GameID !== selectedGame}
									isSelected={pick.GameID === selectedGame}
									loading={loading}
									onClick={() =>
										setSelectedGame(gameID =>
											gameID === pick.GameID ? null : pick.GameID,
										)
									}
									pick={pick}
								/>
								{pick.GameID === selectedGame && (
									<TeamDetail game={pick} onClose={() => setSelectedGame(null)} />
								)}
							</Fragment>
						))}
					</div>
				</DragDropContext>
				<div className="col-12 mb-3 px-md-5">
					<label className="form-label required" htmlFor="tiebreakerScore">
						Tiebreaker Score
						{lastGame &&
							` for ${lastGame.visitorTeam?.TeamName} @ ${lastGame.homeTeam?.TeamName} game`}
					</label>
					<input
						aria-label="Last score of week for tiebreaker"
						className="form-control"
						defaultValue={tiebreaker.TiebreakerLastScore ?? 0}
						id="tiebreakerScore"
						min="1"
						name="tiebreakerLastScore"
						onBlur={updateTiebreakerScore}
						pattern="[0-9]*"
						placeholder={`Guess the total final score${
							lastGame
								? ` of the ${lastGame.visitorTeam?.TeamName} @ ${lastGame.homeTeam?.TeamName} game`
								: ''
						}`}
						required
						type="text"
					/>
					{tiebreakerLastScoreError && (
						<div className="text-danger fs-6">{tiebreakerLastScoreError}</div>
					)}
				</div>
			</div>
			{callback && <ConfirmationModal {...callback} onCancel={() => setCallback(null)} />}
			<div
				className={clsx(
					'position-fixed',
					'd-flex',
					'justify-content-around',
					'align-content-center',
					'bottom-0',
					'end-0',
					'col-12',
					'col-sm-9',
					'col-lg-10',
					styles.toolbar,
				)}
			>
				<div className="col-3 px-1 px-md-2">
					<button
						className="btn btn-danger w-100 my-3"
						disabled={loading !== null || picksUpdating}
						type="button"
						onClick={() => {
							setCallback({
								acceptButton: 'Reset',
								body: (
									<>
										<div className="mb-3">
											Are you sure you want to reset all your picks?
										</div>
										<small>
											Note: Any games that have already started will not be affected. Only
											games that have not kicked off yet will be reset.
										</small>
									</>
								),
								onAccept: resetPicks,
								title: 'Are you sure you want to reset?',
							});
						}}
					>
						<div className="d-block d-md-none">
							<FontAwesomeIcon icon={faRedo} />
						</div>
						{loading === 'reset' ? (
							<>
								<span
									className="spinner-grow spinner-grow-sm d-none d-md-inline-block"
									role="status"
									aria-hidden="true"
								></span>
								Resetting...
							</>
						) : (
							'Reset'
						)}
					</button>
				</div>
				{/* Classes needed: dropdown dropdown-toggle dropdown-menu dropdown-item */}
				<div className="col-3 px-1 px-md-2">
					<Dropdown>
						<Dropdown.Toggle
							className="text-nowrap w-100 my-3"
							disabled={loading !== null || picksUpdating}
							id="auto-pick-button"
							variant="secondary"
						>
							<div className="d-block d-md-none">
								<FontAwesomeIcon
									className="d-inline-block d-md-none"
									icon={faUserRobot}
								/>
							</div>
							{loading === 'autopick' ? (
								<>
									<span
										className="spinner-grow spinner-grow-sm d-none d-md-inline-block"
										role="status"
										aria-hidden="true"
									></span>
									Picking...
								</>
							) : (
								'Auto Pick'
							)}
						</Dropdown.Toggle>
						<Dropdown.Menu>
							<Dropdown.Item onClick={() => autoPick(Users_UserAutoPickStrategy.Away)}>
								Away
							</Dropdown.Item>
							<Dropdown.Item onClick={() => autoPick(Users_UserAutoPickStrategy.Home)}>
								Home
							</Dropdown.Item>
							<Dropdown.Item onClick={() => autoPick(Users_UserAutoPickStrategy.Random)}>
								Random
							</Dropdown.Item>
						</Dropdown.Menu>
					</Dropdown>
				</div>
				<div className="col-3 px-1 px-md-2">
					<button
						className="btn btn-primary w-100 my-3"
						disabled={loading !== null || picksUpdating}
						type="button"
						onClick={savePicks}
					>
						<div className="d-block d-md-none">
							<FontAwesomeIcon className="d-inline-block d-md-none" icon={faSave} />
						</div>
						{loading === 'save' ? (
							<>
								<span
									className="spinner-grow spinner-grow-sm d-none d-md-inline-block"
									role="status"
									aria-hidden="true"
								></span>
								Saving...
							</>
						) : (
							'Save'
						)}
					</button>
				</div>
				<div className="col-3 px-1 px-md-2">
					<button
						className="btn btn-success w-100 my-3"
						disabled={loading !== null || picksUpdating}
						type="button"
						onClick={() =>
							setCallback({
								acceptButton: 'Submit',
								body: (
									<>
										<div className="mb-3">Are you sure you are ready to submit?</div>
										<small>
											Note: You will be unable to make any more changes to this
											week&apos;s picks once submitted and this cannot be undone.
										</small>
									</>
								),
								onAccept: submitPicks,
								title: 'Are you ready to submit?',
							})
						}
					>
						<div className="d-block d-md-none">
							<FontAwesomeIcon
								className="d-inline-block d-md-none"
								icon={faCloudUpload}
							/>
						</div>
						{loading === 'submit' ? (
							<>
								<span
									className="spinner-grow spinner-grow-sm d-none d-md-inline-block"
									role="status"
									aria-hidden="true"
								></span>
								Submitting...
							</>
						) : (
							'Submit'
						)}
					</button>
				</div>
			</div>
			{loading !== null && (
				<div className="position-absolute top-50 start-50 translate-middle text-center">
					<div
						className={clsx('spinner-border', 'text-primary', styles.spinner)}
						role="alert"
					>
						<span className="visually-hidden">Loading...</span>
					</div>
				</div>
			)}
		</SkeletonTheme>
	);
};

export default MakePicksClient;
