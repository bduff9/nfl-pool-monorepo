import type { getGamesForWeek } from "@nfl-pool-monorepo/db/src/queries/game";

import type { getAllPicksForWeek } from "@/server/loaders/pick";
import type { getWeeklyRankings } from "@/server/loaders/weeklyMv";

const weekPlacer = (
  user1: Awaited<ReturnType<typeof getWeeklyRankings>>[number],
  user2: Awaited<ReturnType<typeof getWeeklyRankings>>[number],
): -1 | 0 | 1 => {
  // First, sort by points
  if (user1.PointsEarned > user2.PointsEarned) return -1;

  if (user1.PointsEarned < user2.PointsEarned) return 1;

  // Then, sort by games correct
  if (user1.GamesCorrect > user2.GamesCorrect) return -1;

  if (user1.GamesCorrect < user2.GamesCorrect) return 1;

  // Stop here if last game hasn't been played
  if (typeof user1.LastScore !== "number" || typeof user2.LastScore !== "number") return 0;

  // Otherwise, sort by whomever didn't go over the last game's score
  const lastScoreDiff1 = user1.LastScore - (user1.TiebreakerScore ?? 0);
  const lastScoreDiff2 = user2.LastScore - (user2.TiebreakerScore ?? 0);

  if (lastScoreDiff1 >= 0 && lastScoreDiff2 < 0) return -1;

  if (lastScoreDiff1 < 0 && lastScoreDiff2 >= 0) return 1;

  // Next, sort by the closer to the last games score
  if (Math.abs(lastScoreDiff1) < Math.abs(lastScoreDiff2)) return -1;

  if (Math.abs(lastScoreDiff1) > Math.abs(lastScoreDiff2)) return 1;

  // Finally, if we get here, then they are identical
  return 0;
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
    const [pointsEarned, gamesCorrect] = picks.reduce(
      (acc, pick) => {
        if (pick.UserID !== user.UserID) {
          return acc;
        }

        const game = games[pick.GameID];

        if (!game) {
          return acc;
        }

        if (!pick.TeamID || !game.WinnerTeamID) {
          return acc;
        }

        if (pick.TeamID === game.WinnerTeamID) {
          acc[0] += pick.PickPoints ?? 0;
          acc[1]++;
        }

        return acc;
      },
      [0, 0],
    );

    user.PointsEarned = pointsEarned;
    user.GamesCorrect = gamesCorrect;
  }

  customRanks.sort(weekPlacer);

  customRanks.forEach((user, i, allUsers) => {
    let currPlace = i + 1;
    let result: number;

    if (user.Tied !== 1 || i === 0) {
      user.Rank = currPlace;
    } else {
      currPlace = user.Rank ?? 0;
    }

    const nextUser = allUsers[i + 1];

    if (nextUser) {
      result = weekPlacer(user, nextUser);

      if (result === 0) {
        user.Tied = 1;
        nextUser.Rank = currPlace;
        nextUser.Tied = 1;
      } else {
        if (i === 0) {
          user.Tied = 0;
        }

        nextUser.Tied = 0;
      }
    }
  });

  return customRanks;
};
