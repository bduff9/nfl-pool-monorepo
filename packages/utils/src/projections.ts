export type ProjectionGame = {
  GameHomeScore: number;
  GameID: number;
  GameStatus: string;
  GameVisitorScore: number;
  HomeTeamID: number;
  VisitorTeamID: number;
  WinnerTeamID: null | number;
};

export type ProjectionPick = {
  GameID: number;
  PickPoints: null | number;
  TeamID: null | number;
  UserID: number;
};

/** The team currently ahead on the (possibly overlaid) score, or null before kickoff or when tied. */
export const getLeader = (game: ProjectionGame): null | number => {
  if (game.GameStatus === "Pregame" || game.GameHomeScore === game.GameVisitorScore) {
    return null;
  }

  return game.GameHomeScore > game.GameVisitorScore ? game.HomeTeamID : game.VisitorTeamID;
};

/** The official winner when known, otherwise whoever is currently leading. */
export const getWinningTeam = (game: ProjectionGame): null | number => game.WinnerTeamID ?? getLeader(game);

const pickEarnsPoints = (pick: ProjectionPick, game: ProjectionGame | undefined): boolean =>
  game !== undefined && pick.TeamID !== null && pick.TeamID === getWinningTeam(game);

/** Each user's weekly points if every game ended with its current winner/leader. */
export const getProjectedTotals = (games: ProjectionGame[], picks: ProjectionPick[]): Map<number, number> => {
  const gamesById = new Map(games.map((game) => [game.GameID, game]));
  const totals = new Map<number, number>();

  for (const pick of picks) {
    const earned = pickEarnsPoints(pick, gamesById.get(pick.GameID)) ? (pick.PickPoints ?? 0) : 0;

    totals.set(pick.UserID, (totals.get(pick.UserID) ?? 0) + earned);
  }

  return totals;
};

/** Competition ranking: users with equal totals share a rank (1, 2, 2, 4). */
export const getProjectedRank = (totals: Map<number, number>, userId: number): number => {
  const own = totals.get(userId) ?? 0;

  return 1 + [...totals.values()].filter((total) => total > own).length;
};

/** The games with one game forced to a final result for the given winner. */
export const forceWinner = <T extends ProjectionGame>(games: T[], gameId: number, winnerTeamId: number): T[] =>
  games.map((game) => (game.GameID === gameId ? { ...game, GameStatus: "Final", WinnerTeamID: winnerTeamId } : game));
