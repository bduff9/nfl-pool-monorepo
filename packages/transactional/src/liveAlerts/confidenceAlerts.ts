import type { ProjectionPick } from "@nfl-pool-monorepo/utils/projections";

import { getGamePath, getOpponent, toPeriodPhrase, toPointsText, toScoreText } from "./format";
import { groupBy } from "./groupBy";
import { getRecentTransitions, hasJustEnded, type PlayTransition } from "./recency";
import { getFinalScores } from "./survivorAlerts";
import type { AlertContext, AlertGame, AlertTeam, LiveAlert } from "./types";

const POOL_TITLE = "Live Game Alert";
const LATE_GAME_PERIOD = 4;
const TOP_PICK_COUNT = 3;

type TopPick = { gameId: number; points: number; teamId: number; userId: number };

const toTopPicks = (picks: ProjectionPick[]): TopPick[] =>
  [...picks]
    .sort((a, b) => (b.PickPoints ?? 0) - (a.PickPoints ?? 0))
    .slice(0, TOP_PICK_COUNT)
    .map((pick) => ({
      gameId: pick.GameID,
      points: pick.PickPoints ?? 0,
      teamId: pick.TeamID ?? 0,
      userId: pick.UserID,
    }));

/** Each subscriber's highest-point picks of the week, grouped by game. */
const getTopPicksByGame = (context: AlertContext): Map<number, TopPick[]> => {
  const made = context.picks.filter((pick) => context.subscribers.has(pick.UserID) && pick.TeamID !== null);
  const byUser = groupBy(made, (pick) => pick.UserID);

  return groupBy([...byUser.values()].flatMap(toTopPicks), (pick) => pick.gameId);
};

/** The team that took the lead on this play, or null when the lead did not change hands (or became a tie). */
const getNewLeader = (game: AlertGame, transition: PlayTransition): AlertTeam | null => {
  const before = Math.sign(transition.homeBefore - transition.awayBefore);
  const after = Math.sign(transition.play.homeScore - transition.play.awayScore);

  if (after === 0 || after === before) {
    return null;
  }

  return after > 0 ? game.home : game.visitor;
};

const getLeadChangeBody = (game: AlertGame, leader: AlertTeam, pick: TopPick, transition: PlayTransition): string => {
  const { awayScore, homeScore, period } = transition.play;
  const state = pick.teamId === leader.id ? "winning" : "losing";
  const score = toScoreText(homeScore, awayScore);

  return `${leader.shortName} takes a ${score} lead over ${getOpponent(game, leader).shortName} ${toPeriodPhrase(period)} — your ${pick.points}-point pick is now ${state}.`;
};

const getLeadChangeAlertsForPlay = (game: AlertGame, transition: PlayTransition, topPicks: TopPick[]): LiveAlert[] => {
  const leader = getNewLeader(game, transition);

  if (!leader) {
    return [];
  }

  return topPicks.map(
    (pick): LiveAlert => ({
      body: getLeadChangeBody(game, leader, pick, transition),
      key: transition.play.id,
      path: getGamePath(game),
      title: POOL_TITLE,
      type: "leadChange",
      userId: pick.userId,
    }),
  );
};

/** A team took the lead in the 4th or overtime in a game one of the user's three biggest picks rides on. */
export const getLeadChangeAlerts = (context: AlertContext): LiveAlert[] => {
  const topPicksByGame = getTopPicksByGame(context);

  return context.games.flatMap((game) =>
    getRecentTransitions(game, context.now)
      .filter(({ play }) => play.period >= LATE_GAME_PERIOD)
      .flatMap((transition) => getLeadChangeAlertsForPlay(game, transition, topPicksByGame.get(game.gameId) ?? [])),
  );
};

const getWinner = (game: AlertGame): AlertTeam | null => {
  if (game.homeScore === game.visitorScore) {
    return null;
  }

  return game.homeScore > game.visitorScore ? game.home : game.visitor;
};

const getPointsBody = (game: AlertGame, winner: AlertTeam, points: number): string => {
  const [winnerScore, loserScore] = getFinalScores(game, winner);
  const score = toScoreText(winnerScore, loserScore);

  return `You just earned ${toPointsText(points)}: the ${winner.name} beat the ${getOpponent(game, winner).name} ${score}.`;
};

const getPointsAlertsForGame = (context: AlertContext, game: AlertGame): LiveAlert[] => {
  const winner = getWinner(game);

  if (!winner) {
    return [];
  }

  return context.picks
    .filter((pick) => pick.GameID === game.gameId && pick.TeamID === winner.id)
    .filter((pick) => context.subscribers.has(pick.UserID) && (pick.PickPoints ?? 0) > 0)
    .map(
      (pick): LiveAlert => ({
        body: getPointsBody(game, winner, pick.PickPoints ?? 0),
        key: game.eventId,
        path: getGamePath(game),
        title: POOL_TITLE,
        type: "pointsEarned",
        userId: pick.UserID,
      }),
    );
};

/** A game the user picked correctly just ended. */
export const getPointsEarnedAlerts = (context: AlertContext): LiveAlert[] =>
  context.games
    .filter((game) => hasJustEnded(game, context.now))
    .flatMap((game) => getPointsAlertsForGame(context, game));
