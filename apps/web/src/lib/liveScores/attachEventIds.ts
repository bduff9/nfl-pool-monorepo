import type { EspnEventIdMap } from "./espnEventIds";
import { getLiveScoreKey } from "./parseEspn";

export type EventIdGame = {
  GameStatus: string;
  espnEventId?: string | undefined;
  homeTeam: { TeamShortName: string } | null;
  visitorTeam: { TeamShortName: string } | null;
};

/** True when the database has marked at least one game final, i.e. there may be finished games to link. */
export const hasFinalGame = (games: Pick<EventIdGame, "GameStatus">[]): boolean =>
  games.some((game) => game.GameStatus === "Final");

const getEventId = (game: EventIdGame, eventIds: EspnEventIdMap): string | undefined => {
  if (!game.homeTeam || !game.visitorTeam) {
    return undefined;
  }

  return eventIds[getLiveScoreKey(game.visitorTeam.TeamShortName, game.homeTeam.TeamShortName)];
};

/**
 * Adds the ESPN event id to final games that do not have one yet (the live overlay only sets it on games it
 * touched). Every other game, and games without a match, are returned unchanged.
 */
export const attachEventIds = <T extends EventIdGame>(games: T[], eventIds: EspnEventIdMap): T[] =>
  games.map((game) => {
    if (game.GameStatus !== "Final" || game.espnEventId) {
      return game;
    }

    const espnEventId = getEventId(game, eventIds);

    return espnEventId ? { ...game, espnEventId } : game;
  });
