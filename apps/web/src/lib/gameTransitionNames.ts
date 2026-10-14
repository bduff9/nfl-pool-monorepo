/**
 * View transition name shared by a game's scoreboard card and the same card on its game page (and that page's
 * skeleton), so the card moves between the two. Keyed by the ESPN event id because the game page only knows that id.
 * Without an event id the card has no game page, so it gets no name.
 */
export const getGameTransitionName = (eventId: string | undefined): string | undefined =>
  eventId ? `game-${eventId}` : undefined;

/**
 * View transition name of a game's possession football. Only the team with the ball shows it, so it is rendered once
 * per game and moves from one team's row to the other's when possession changes.
 */
export const getPossessionTransitionName = (gameId: number): string => `possession-${gameId}`;

/** View transition name of one team's score on a game's card, so a changed score rolls in place (see ScoreboardTeam) */
export const getScoreTransitionName = (gameId: number, teamId: number): string => `score-${gameId}-${teamId}`;
