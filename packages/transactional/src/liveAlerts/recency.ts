import type { AlertGame, AlertPlay } from "./types";

const MS_PER_MINUTE = 60_000;
const RECENT_PLAY_MINUTES = 10;
const RECENT_GAME_END_MINUTES = 30;

/** A scoring play together with the score that stood just before it. */
export type PlayTransition = {
  awayBefore: number;
  homeBefore: number;
  play: AlertPlay;
};

const isWithinMinutes = (moment: Date, now: Date, minutes: number): boolean =>
  now.getTime() - moment.getTime() <= minutes * MS_PER_MINUTE;

/**
 * Scoring plays from the last few minutes, each with the score before it. Plays without a timestamp are
 * ignored, so a deploy in the middle of a game can never announce old events.
 */
export const getRecentTransitions = (game: AlertGame, now: Date): PlayTransition[] =>
  game.plays
    .map((play, index) => ({
      awayBefore: game.plays[index - 1]?.awayScore ?? 0,
      homeBefore: game.plays[index - 1]?.homeScore ?? 0,
      play,
    }))
    .filter(({ play }) => play.wallclock !== null && isWithinMinutes(play.wallclock, now, RECENT_PLAY_MINUTES));

/** True when ESPN reports the game over and, if it says when, that was recent. */
export const hasJustEnded = (game: AlertGame, now: Date): boolean =>
  game.state === "post" && (game.endedAt === null || isWithinMinutes(game.endedAt, now, RECENT_GAME_END_MINUTES));
