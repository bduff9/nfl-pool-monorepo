import { getGamePath, getOpponent, toPeriodPhrase, toScoreText } from "./format";
import { getRecentTransitions, hasJustEnded, type PlayTransition } from "./recency";
import type { AlertContext, AlertGame, AlertTeam, LiveAlert, SurvivorAlertPick } from "./types";

const SURVIVOR_TITLE = "Survivor Pool";
const LATE_GAME_PERIOD = 4;

const getTeamPicks = (context: AlertContext, game: AlertGame): Array<SurvivorAlertPick & { team: AlertTeam }> =>
  context.survivorPicks
    .filter((pick) => context.subscribers.has(pick.userId))
    .flatMap((pick) => {
      const team = [game.home, game.visitor].find((candidate) => candidate.id === pick.teamId);

      return team ? [{ ...pick, team }] : [];
    });

/** The team's lead (negative when trailing) in a score. */
const getMargin = (game: AlertGame, team: AlertTeam, homeScore: number, awayScore: number): number =>
  team.id === game.home.id ? homeScore - awayScore : awayScore - homeScore;

const getBehindBody = (game: AlertGame, team: AlertTeam, transition: PlayTransition): string => {
  const { awayScore, homeScore, period } = transition.play;
  const opponent = getOpponent(game, team);
  const score = toScoreText(homeScore, awayScore);
  const status =
    homeScore === awayScore
      ? `${team.shortName} and ${opponent.shortName} are tied ${score}`
      : `${team.shortName} now trails ${opponent.shortName} ${score}`;

  return `${status} ${toPeriodPhrase(period)}. Your survivor pick is in trouble.`;
};

const getBehindAlerts = (context: AlertContext, game: AlertGame, transition: PlayTransition): LiveAlert[] => {
  const { awayScore, homeScore } = transition.play;

  return getTeamPicks(context, game)
    .filter(({ team }) => {
      const before = getMargin(game, team, transition.homeBefore, transition.awayBefore);
      const after = getMargin(game, team, homeScore, awayScore);

      // Ahead -> tied or behind, or tied -> behind
      return Math.sign(after) < Math.sign(before);
    })
    .map(
      ({ team, userId }): LiveAlert => ({
        body: getBehindBody(game, team, transition),
        key: transition.play.id,
        path: getGamePath(game),
        title: SURVIVOR_TITLE,
        type: "survivorBehind",
        userId,
      }),
    );
};

/** Survivor pick fell behind or tied in the 4th quarter or overtime on a recent scoring play. */
export const getSurvivorBehindAlerts = (context: AlertContext): LiveAlert[] =>
  context.games.flatMap((game) =>
    getRecentTransitions(game, context.now)
      .filter(({ play }) => play.period >= LATE_GAME_PERIOD)
      .flatMap((transition) => getBehindAlerts(context, game, transition)),
  );

/** Final score as [the team's, the opponent's]. */
export const getFinalScores = (game: AlertGame, team: AlertTeam): [number, number] =>
  team.id === game.home.id ? [game.homeScore, game.visitorScore] : [game.visitorScore, game.homeScore];

const getResultBody = (game: AlertGame, team: AlertTeam, week: number): string => {
  const [ownScore, otherScore] = getFinalScores(game, team);
  const score = toScoreText(ownScore, otherScore);

  if (ownScore === otherScore) {
    return `${team.shortName} tied ${score}. Ties count as a loss in survivor, so your pick is likely out (official result coming soon).`;
  }

  return ownScore > otherScore
    ? `${team.shortName} won ${score}. You survive week ${week}!`
    : `${team.shortName} lost ${score}. Your survivor pick is likely out (official result coming soon).`;
};

/** Survivor pick's game just ended: they survive, or (a loss or a tie) they are probably out. */
export const getSurvivorResultAlerts = (context: AlertContext): LiveAlert[] =>
  context.games
    .filter((game) => hasJustEnded(game, context.now))
    .flatMap((game) =>
      getTeamPicks(context, game).map(
        ({ team, userId }): LiveAlert => ({
          body: getResultBody(game, team, game.week),
          key: game.eventId,
          path: getGamePath(game),
          title: SURVIVOR_TITLE,
          type: "survivorResult",
          userId,
        }),
      ),
    );
