import { getLiveScoreKey, type LiveScore, type LiveScoreMap } from "./parseEspn";

type GameStatus =
  | "1st Quarter"
  | "2nd Quarter"
  | "3rd Quarter"
  | "4th Quarter"
  | "Final"
  | "Half Time"
  | "Invalid"
  | "Overtime"
  | "Pregame";

type TeamRef = { TeamShortName: string } | null;

export type OverlayableGame = {
  GameHasPossession: number | null;
  GameHomeScore: number;
  GameInRedzone: number | null;
  GameKickoff: Date;
  GameStatus: GameStatus;
  GameTimeLeftInQuarter: string;
  GameVisitorScore: number;
  HomeTeamID: number;
  VisitorTeamID: number;
  homeTeam: TeamRef;
  visitorTeam: TeamRef;
};

/** A game plus whether its score/clock came from the live overlay rather than the database. */
export type WithLiveFlag<T> = T & { isLiveOverlay: boolean };

// A game that kicked off longer ago than this and is still not final in the database is treated as stale,
// not live, so old unfinished rows never keep a page polling.
const LIVE_WINDOW_MS = 6 * 60 * 60 * 1000;
const QUARTERS: GameStatus[] = ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"];

/**
 * True when the database says the game is in progress, or kickoff has passed (within the live window) and
 * the database has not marked it final yet. These are the only games the overlay may touch.
 */
export const isLiveCandidate = (game: Pick<OverlayableGame, "GameKickoff" | "GameStatus">, now: Date): boolean => {
  if (game.GameStatus === "Final") {
    return false;
  }

  if (game.GameStatus !== "Pregame") {
    return true;
  }

  const sinceKickoff = now.getTime() - game.GameKickoff.getTime();

  return sinceKickoff >= 0 && sinceKickoff <= LIVE_WINDOW_MS;
};

const toGameStatus = (live: LiveScore): GameStatus => {
  if (live.final) {
    return "Final";
  }

  if (/half/i.test(live.detail)) {
    return "Half Time";
  }

  if (live.period >= 5) {
    return "Overtime";
  }

  return QUARTERS[live.period - 1] ?? "1st Quarter";
};

const getLiveScore = (game: OverlayableGame, liveScores: LiveScoreMap): LiveScore | undefined => {
  if (!game.homeTeam || !game.visitorTeam) {
    return undefined;
  }

  return liveScores[getLiveScoreKey(game.visitorTeam.TeamShortName, game.homeTeam.TeamShortName)];
};

// Stored as the team ID with the ball, matching how the official feed fills GameHasPossession/GameInRedzone
const getPossessionTeamId = (game: OverlayableGame, live: LiveScore): number | null => {
  if (live.final || !live.possession) {
    return null;
  }

  return live.possession === "home" ? game.HomeTeamID : game.VisitorTeamID;
};

const overlayGame = <T extends OverlayableGame>(game: T, live: LiveScore): WithLiveFlag<T> => {
  const possessionTeamId = getPossessionTeamId(game, live);

  return {
    ...game,
    GameHasPossession: possessionTeamId,
    GameHomeScore: live.homeScore,
    GameInRedzone: live.inRedZone ? possessionTeamId : null,
    GameStatus: toGameStatus(live),
    GameTimeLeftInQuarter: live.clock,
    GameVisitorScore: live.visitorScore,
    isLiveOverlay: true,
  };
};

/**
 * Overlays ESPN live scores onto games the database considers live (see isLiveCandidate). Games without an
 * ESPN match are returned unchanged, so the page renders exactly as it does without the overlay.
 */
export const applyLiveScores = <T extends OverlayableGame>(
  games: T[],
  liveScores: LiveScoreMap,
  now: Date,
): WithLiveFlag<T>[] =>
  games.map((game) => {
    const live = isLiveCandidate(game, now) ? getLiveScore(game, liveScores) : undefined;

    return live ? overlayGame(game, live) : { ...game, isLiveOverlay: false };
  });
