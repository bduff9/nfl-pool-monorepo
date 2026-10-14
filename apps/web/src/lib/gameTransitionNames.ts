/**
 * View transition name shared by a game's scoreboard card and the same card on its game page (and that page's
 * skeleton), so the card moves between the two. Keyed by the ESPN event id because the game page only knows that id.
 * Without an event id the card has no game page, so it gets no name.
 */
export const getGameTransitionName = (eventId: string | undefined): string | undefined =>
  eventId ? `game-${eventId}` : undefined;
