import {
  forceWinner,
  getProjectedRank,
  getProjectedTotals,
  getWinningTeam,
  isProjectedRankTied,
  type ProjectionGame,
  type ProjectionPick,
} from "@nfl-pool-monorepo/utils/projections";

import { isLiveCandidate, type OverlayableGame } from "@/lib/liveScores/applyLiveScores";

export type RidingGame = Pick<OverlayableGame, "GameKickoff" | "GameStatus"> & ProjectionGame;

export type RidingPick = ProjectionPick;

export type PickStatus = "losing" | "tied" | "winning";

type SideSplit = { count: number; points: number };

type PoolSplit = { home: SideSplit; visitor: SideSplit };

type Scenario = { isTied: boolean; rank: number; total: number };

export type GameStakes = {
  currentIsTied: boolean;
  currentRank: number;
  currentTotal: number;
  pick: null | {
    ifLoses: Scenario;
    ifWins: Scenario;
    points: number;
    status: PickStatus;
    teamId: number;
  };
  split: PoolSplit;
};

const getPickStatus = (game: RidingGame, teamId: number): PickStatus => {
  const winning = getWinningTeam(game);

  if (winning === null) {
    return "tied";
  }

  return winning === teamId ? "winning" : "losing";
};

const getSide = (split: PoolSplit, game: RidingGame, teamId: null | number): SideSplit | undefined => {
  if (teamId === game.HomeTeamID) {
    return split.home;
  }

  return teamId === game.VisitorTeamID ? split.visitor : undefined;
};

const getPoolSplit = (picks: RidingPick[], game: RidingGame): PoolSplit => {
  const split: PoolSplit = { home: { count: 0, points: 0 }, visitor: { count: 0, points: 0 } };

  for (const pick of picks.filter((candidate) => candidate.GameID === game.GameID)) {
    const side = getSide(split, game, pick.TeamID);

    if (side) {
      side.count += 1;
      side.points += pick.PickPoints ?? 0;
    }
  }

  return split;
};

/** True for games that have kicked off and are not final, plus games the live overlay has just marked final. */
const hasStakes = (game: RidingGame & { isLiveOverlay?: boolean }, now: Date): boolean =>
  isLiveCandidate(game, now) || game.isLiveOverlay === true;

const getScenario = (
  games: RidingGame[],
  picks: RidingPick[],
  gameId: number,
  winnerTeamId: number,
  userId: number,
): Scenario => {
  const totals = getProjectedTotals(forceWinner(games, gameId, winnerTeamId), picks);

  return {
    isTied: isProjectedRankTied(totals, userId),
    rank: getProjectedRank(totals, userId),
    total: totals.get(userId) ?? 0,
  };
};

const buildMyPick = (
  game: RidingGame,
  myPick: RidingPick & { TeamID: number },
  games: RidingGame[],
  picks: RidingPick[],
): NonNullable<GameStakes["pick"]> => {
  const otherTeamId = myPick.TeamID === game.HomeTeamID ? game.VisitorTeamID : game.HomeTeamID;

  return {
    ifLoses: getScenario(games, picks, game.GameID, otherTeamId, myPick.UserID),
    ifWins: getScenario(games, picks, game.GameID, myPick.TeamID, myPick.UserID),
    points: myPick.PickPoints ?? 0,
    status: getPickStatus(game, myPick.TeamID),
    teamId: myPick.TeamID,
  };
};

const buildOneGame = (
  game: RidingGame,
  games: RidingGame[],
  picks: RidingPick[],
  userId: number,
  totals: Map<number, number>,
): GameStakes => {
  const myPick = picks.find((pick) => pick.UserID === userId && pick.GameID === game.GameID);

  return {
    currentIsTied: isProjectedRankTied(totals, userId),
    currentRank: getProjectedRank(totals, userId),
    currentTotal: totals.get(userId) ?? 0,
    pick: myPick?.TeamID ? buildMyPick(game, { ...myPick, TeamID: myPick.TeamID }, games, picks) : null,
    split: getPoolSplit(picks, game),
  };
};

/**
 * Builds the "what's riding on this game" data for every started, not-yet-final game. Pick-level detail is only
 * ever derived for the signed-in user; everyone else's picks only feed aggregate counts and projected ranks.
 */
export const buildGameStakes = (
  games: (RidingGame & { isLiveOverlay?: boolean })[],
  picks: RidingPick[],
  userId: number,
  now: Date,
): Record<number, GameStakes> => {
  const totals = getProjectedTotals(games, picks);
  const stakes: Record<number, GameStakes> = {};

  for (const game of games.filter((candidate) => hasStakes(candidate, now))) {
    stakes[game.GameID] = buildOneGame(game, games, picks, userId, totals);
  }

  return stakes;
};
