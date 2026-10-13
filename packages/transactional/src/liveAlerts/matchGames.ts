import type { AlertGame, AlertPlay } from "./types";

/** A game row as our database has it, with both teams. */
export type DbAlertGame = {
  GameID: number;
  GameWeek: number;
  HomeTeamID: number;
  HomeTeamName: string;
  HomeTeamShortName: string;
  VisitorTeamID: number;
  VisitorTeamName: string;
  VisitorTeamShortName: string;
};

/** The parts of an ESPN scoreboard game needed to match it to ours. */
export type EspnGameRef = {
  away: { score: number; shortName: string };
  eventId: string;
  home: { score: number; shortName: string };
  state: "in" | "post";
};

export type EspnSummaryData = {
  lastPlayAt: Date | null;
  scoringPlays: Array<AlertPlay & { id: string }>;
};

/** Pairs each live or finished ESPN game with the database game between the same two teams. */
export const matchEspnGames = <T extends EspnGameRef>(
  dbGames: DbAlertGame[],
  espnGames: T[],
): Array<{ dbGame: DbAlertGame; espnGame: T }> =>
  espnGames.flatMap((espnGame) => {
    const dbGame = dbGames.find(
      (candidate) =>
        candidate.HomeTeamShortName === espnGame.home.shortName &&
        candidate.VisitorTeamShortName === espnGame.away.shortName,
    );

    return dbGame ? [{ dbGame, espnGame }] : [];
  });

export const toAlertGame = (dbGame: DbAlertGame, espnGame: EspnGameRef, summary: EspnSummaryData): AlertGame => ({
  endedAt: summary.lastPlayAt,
  eventId: espnGame.eventId,
  gameId: dbGame.GameID,
  home: { id: dbGame.HomeTeamID, name: dbGame.HomeTeamName, shortName: dbGame.HomeTeamShortName },
  homeScore: espnGame.home.score,
  plays: summary.scoringPlays,
  state: espnGame.state,
  visitor: { id: dbGame.VisitorTeamID, name: dbGame.VisitorTeamName, shortName: dbGame.VisitorTeamShortName },
  visitorScore: espnGame.away.score,
  week: dbGame.GameWeek,
});
