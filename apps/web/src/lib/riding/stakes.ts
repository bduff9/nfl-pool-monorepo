import { isLiveCandidate, type OverlayableGame } from "@/lib/liveScores/applyLiveScores";

export type RidingGame = Pick<OverlayableGame, "GameHomeScore" | "GameKickoff" | "GameStatus" | "GameVisitorScore"> & {
  GameID: number;
  HomeTeamID: number;
  VisitorTeamID: number;
  WinnerTeamID: null | number;
};

export type RidingPick = {
  GameID: number;
  PickPoints: null | number;
  TeamID: null | number;
  UserID: number;
};

export type PickStatus = "losing" | "tied" | "winning";

type SideSplit = { count: number; points: number };

type PoolSplit = { home: SideSplit; visitor: SideSplit };

type Scenario = { rank: number; total: number };

export type GameStakes = {
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

/** The team currently ahead on the (possibly overlaid) score, or null before kickoff or when tied. */
const getLeader = (game: RidingGame): null | number => {
  if (game.GameStatus === "Pregame" || game.GameHomeScore === game.GameVisitorScore) {
    return null;
  }

  return game.GameHomeScore > game.GameVisitorScore ? game.HomeTeamID : game.VisitorTeamID;
};

/** The official winner when known, otherwise whoever is currently leading. */
const getWinningTeam = (game: RidingGame): null | number => game.WinnerTeamID ?? getLeader(game);

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

const pickEarnsPoints = (pick: RidingPick, game: RidingGame | undefined): boolean =>
  game !== undefined && pick.TeamID !== null && pick.TeamID === getWinningTeam(game);

/** Each user's weekly points if every game ended with its current winner/leader. */
const getProjectedTotals = (games: RidingGame[], picks: RidingPick[]): Map<number, number> => {
  const gamesById = new Map(games.map((game) => [game.GameID, game]));
  const totals = new Map<number, number>();

  for (const pick of picks) {
    const earned = pickEarnsPoints(pick, gamesById.get(pick.GameID)) ? (pick.PickPoints ?? 0) : 0;

    totals.set(pick.UserID, (totals.get(pick.UserID) ?? 0) + earned);
  }

  return totals;
};

/** Competition ranking: users with equal totals share a rank (1, 2, 2, 4). */
const getProjectedRank = (totals: Map<number, number>, userId: number): number => {
  const own = totals.get(userId) ?? 0;

  return 1 + [...totals.values()].filter((total) => total > own).length;
};

/** True for games that have kicked off and are not final, plus games the live overlay has just marked final. */
const hasStakes = (game: RidingGame & { isLiveOverlay?: boolean }, now: Date): boolean =>
  isLiveCandidate(game, now) || game.isLiveOverlay === true;

const forceWinner = (games: RidingGame[], gameId: number, winnerTeamId: number): RidingGame[] =>
  games.map((game) => (game.GameID === gameId ? { ...game, GameStatus: "Final", WinnerTeamID: winnerTeamId } : game));

const getScenario = (
  games: RidingGame[],
  picks: RidingPick[],
  gameId: number,
  winnerTeamId: number,
  userId: number,
): Scenario => {
  const totals = getProjectedTotals(forceWinner(games, gameId, winnerTeamId), picks);

  return { rank: getProjectedRank(totals, userId), total: totals.get(userId) ?? 0 };
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
