import type { ProjectionGame, ProjectionPick } from "@nfl-pool-monorepo/utils/projections";

export type LiveAlertType = "leadChange" | "pointsEarned" | "rankChange" | "survivorBehind" | "survivorResult";

export type LiveAlert = {
  body: string;
  /** What the alert is about (a play id or an event id); with the type and user it makes the alert unique. */
  key: string;
  path: string;
  title: string;
  type: LiveAlertType;
  userId: number;
};

export type AlertTeam = {
  id: number;
  /** TeamName, e.g. "Bills". */
  name: string;
  /** TeamShortName, e.g. "BUF". */
  shortName: string;
};

/** A scoring play with the score after it; oldest first within a game. */
export type AlertPlay = {
  awayScore: number;
  homeScore: number;
  id: string;
  period: number;
  wallclock: Date | null;
};

/** One of our games matched to its live or just-finished ESPN event. */
export type AlertGame = {
  /** When ESPN's last play happened, used to avoid announcing a game that ended long ago. */
  endedAt: Date | null;
  eventId: string;
  gameId: number;
  home: AlertTeam;
  homeScore: number;
  plays: AlertPlay[];
  state: "in" | "post";
  visitor: AlertTeam;
  visitorScore: number;
  week: number;
};

export type SurvivorAlertPick = { teamId: number; userId: number };

export type AlertContext = {
  games: AlertGame[];
  now: Date;
  picks: ProjectionPick[];
  /** Every game of the week as the database has it, before any ESPN data is layered on. */
  projectionGames: ProjectionGame[];
  /** Users who have live game alerts turned on. */
  subscribers: Set<number>;
  /** Survivor picks of users who are still alive. */
  survivorPicks: SurvivorAlertPick[];
  week: number;
};
