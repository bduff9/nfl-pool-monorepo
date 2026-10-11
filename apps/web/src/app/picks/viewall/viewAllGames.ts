export const updateGames = <T extends { GameID: number }>(games: T[]): Record<number, T> => {
  const gamesMap: Record<number, T> = {};

  for (const game of games) {
    gamesMap[game.GameID] ??= game;
  }

  return gamesMap;
};

type ResolveArgs<T extends { GameID: number }> = {
  customGames: null | Record<number, T>;
  gamesForWeek: T[];
  isLive: boolean;
};

// Deriving from gamesForWeek on every render (rather than copying it into state) keeps
// live scores from going stale if the page refreshes with updated props while this stays mounted.
export const resolveViewAllGames = <T extends { GameID: number }>({
  customGames,
  gamesForWeek,
  isLive,
}: ResolveArgs<T>): { games: Record<number, T>; isShowingCustomGames: boolean } => {
  if (!isLive && customGames) {
    return { games: customGames, isShowingCustomGames: true };
  }

  return { games: updateGames(gamesForWeek), isShowingCustomGames: false };
};
