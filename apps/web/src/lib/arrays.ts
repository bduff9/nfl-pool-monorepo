import type { getGamesForWeek } from "@nfl-pool-monorepo/db/src/queries/game";

import type { getAllPicksForWeek } from "@/server/loaders/pick";
import type { getWeeklyRankings } from "@/server/loaders/weeklyMv";

type Ranking = Awaited<ReturnType<typeof getWeeklyRankings>>[number];
type Game = Awaited<ReturnType<typeof getGamesForWeek>>[number];

// Higher values sort first
const compareDescending = (a: number, b: number): -1 | 0 | 1 => {
  if (a === b) return 0;

  return a > b ? -1 : 1;
};

// The final game's score minus the user's guess, or null while the last game hasn't been played
const getLastScoreDiff = (user: Ranking): null | number =>
  typeof user.LastScore === "number" ? user.LastScore - (user.TiebreakerScore ?? 0) : null;

// Whoever didn't go over the last game's score wins, then whoever was closer
const compareLastScoreDiffs = (diff1: number, diff2: number): -1 | 0 | 1 => {
  const over1 = diff1 < 0;
  const over2 = diff2 < 0;

  if (over1 !== over2) return over1 ? 1 : -1;

  return compareDescending(Math.abs(diff2), Math.abs(diff1));
};

const compareTiebreaker = (user1: Ranking, user2: Ranking): -1 | 0 | 1 => {
  const diff1 = getLastScoreDiff(user1);
  const diff2 = getLastScoreDiff(user2);

  // Stop here if last game hasn't been played
  if (diff1 === null || diff2 === null) return 0;

  return compareLastScoreDiffs(diff1, diff2);
};

const weekPlacer = (user1: Ranking, user2: Ranking): -1 | 0 | 1 => {
  // First, sort by points
  const byPoints = compareDescending(user1.PointsEarned, user2.PointsEarned);

  if (byPoints !== 0) return byPoints;

  // Then, sort by games correct
  const byGames = compareDescending(user1.GamesCorrect, user2.GamesCorrect);

  if (byGames !== 0) return byGames;

  // Finally, fall back to the last game's score
  return compareTiebreaker(user1, user2);
};

const isWinningPick = (pick: Awaited<ReturnType<typeof getAllPicksForWeek>>[number], game: Game | undefined): boolean =>
  !!game && !!pick.TeamID && !!game.WinnerTeamID && pick.TeamID === game.WinnerTeamID;

const tallyUserPicks = (
  picks: Awaited<ReturnType<typeof getAllPicksForWeek>>,
  games: Record<number, Game>,
  userID: number,
): [pointsEarned: number, gamesCorrect: number] => {
  const winners = picks.filter((pick) => pick.UserID === userID && isWinningPick(pick, games[pick.GameID]));

  return [winners.reduce((sum, pick) => sum + (pick.PickPoints ?? 0), 0), winners.length];
};

// Sets the user's rank (a tied user keeps the rank their predecessor handed them) and returns the place
const assignRank = (user: Ranking, i: number): number => {
  if (user.Tied !== 1 || i === 0) {
    user.Rank = i + 1;

    return i + 1;
  }

  return user.Rank ?? 0;
};

const markTiesWithNext = (user: Ranking, nextUser: Ranking, i: number, currPlace: number): void => {
  if (weekPlacer(user, nextUser) === 0) {
    user.Tied = 1;
    nextUser.Rank = currPlace;
    nextUser.Tied = 1;

    return;
  }

  if (i === 0) {
    user.Tied = 0;
  }

  nextUser.Tied = 0;
};

export const sortPicks = (
  picks: Awaited<ReturnType<typeof getAllPicksForWeek>>,
  games: Record<number, Awaited<ReturnType<typeof getGamesForWeek>>[number]>,
  ranks: Awaited<ReturnType<typeof getWeeklyRankings>>,
): Awaited<ReturnType<typeof getWeeklyRankings>> => {
  if (!picks || !ranks) {
    return [];
  }

  const customRanks = ranks.map((rank) => ({
    ...rank,
    GamesCorrect: 0,
    PointsEarned: 0,
    Rank: 0,
    Tied: 0,
  }));

  console.log(customRanks);
  for (const user of customRanks) {
    const [pointsEarned, gamesCorrect] = tallyUserPicks(picks, games, user.UserID);

    user.PointsEarned = pointsEarned;
    user.GamesCorrect = gamesCorrect;
  }

  customRanks.sort(weekPlacer);

  customRanks.forEach((user, i, allUsers) => {
    const currPlace = assignRank(user, i);
    const nextUser = allUsers[i + 1];

    if (nextUser) {
      markTiesWithNext(user, nextUser, i, currPlace);
    }
  });

  return customRanks;
};
