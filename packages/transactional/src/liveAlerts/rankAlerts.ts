import { getProjectedRank, getProjectedTotals, type ProjectionGame } from "@nfl-pool-monorepo/utils/projections";

import { getWeekPath, toOrdinal } from "./format";
import { getRecentTransitions, type PlayTransition } from "./recency";
import type { AlertContext, AlertGame, LiveAlert } from "./types";

const RANK_TITLE = "Weekly Standings";
const TOP_RANKS = 2;

type Standing = { rank: number; tied: boolean };

/** The game as it stood with the given score, in play and undecided. */
const withScore = (
  games: ProjectionGame[],
  gameId: number,
  homeScore: number,
  visitorScore: number,
): ProjectionGame[] =>
  games.map((game) =>
    game.GameID === gameId
      ? {
          ...game,
          GameHomeScore: homeScore,
          GameStatus: "In Progress",
          GameVisitorScore: visitorScore,
          WinnerTeamID: null,
        }
      : game,
  );

const getStanding = (totals: Map<number, number>, userId: number): Standing => {
  const own = totals.get(userId) ?? 0;

  return {
    rank: getProjectedRank(totals, userId),
    tied: [...totals.values()].filter((total) => total === own).length > 1,
  };
};

const isFirst = (rank: number): boolean => rank === 1;

const isTopTwo = (rank: number): boolean => rank <= TOP_RANKS;

const hasCrossed = (before: number, after: number): boolean =>
  isFirst(before) !== isFirst(after) || isTopTwo(before) !== isTopTwo(after);

const toRankLabel = ({ rank, tied }: Standing): string => `${toOrdinal(rank)}${tied ? " (tied)" : ""}`;

const getRankBody = (before: Standing, after: Standing, week: number): string => {
  if (after.rank < before.rank) {
    return after.rank === 1
      ? `You're now projected ${toRankLabel(after)} for week ${week}!`
      : `You've moved up to projected ${toRankLabel(after)} for week ${week}.`;
  }

  return `You've dropped to projected ${toRankLabel(after)} for week ${week}.`;
};

const changesLeader = (transition: PlayTransition): boolean =>
  Math.sign(transition.homeBefore - transition.awayBefore) !==
  Math.sign(transition.play.homeScore - transition.play.awayScore);

const getRankAlertsForPlay = (context: AlertContext, game: AlertGame, transition: PlayTransition): LiveAlert[] => {
  const { awayBefore, homeBefore, play } = transition;
  const before = getProjectedTotals(
    withScore(context.projectionGames, game.gameId, homeBefore, awayBefore),
    context.picks,
  );
  const after = getProjectedTotals(
    withScore(context.projectionGames, game.gameId, play.homeScore, play.awayScore),
    context.picks,
  );

  return [...context.subscribers]
    .filter(
      (userId) => before.has(userId) && hasCrossed(getProjectedRank(before, userId), getProjectedRank(after, userId)),
    )
    .map(
      (userId): LiveAlert => ({
        body: getRankBody(getStanding(before, userId), getStanding(after, userId), context.week),
        key: play.id,
        path: getWeekPath(context.week),
        title: RANK_TITLE,
        type: "rankChange",
        userId,
      }),
    );
};

/**
 * Users whose projected weekly rank moved into or out of 1st or the top two because a recent scoring play changed
 * which team leads a game. Each user is only told about their own standing.
 */
export const getRankChangeAlerts = (context: AlertContext): LiveAlert[] =>
  context.games.flatMap((game) =>
    getRecentTransitions(game, context.now)
      .filter(changesLeader)
      .flatMap((transition) => getRankAlertsForPlay(context, game, transition)),
  );
