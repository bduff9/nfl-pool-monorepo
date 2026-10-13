import { type } from "arktype";

import { toTeamShortName } from "./teams";

export type EspnCompetitor = {
  espnTeamId: string;
  /** The team code stored in our database (TeamShortName), not ESPN's abbreviation. */
  shortName: string;
  score: number;
};

export type EspnGame = {
  away: EspnCompetitor;
  eventId: string;
  home: EspnCompetitor;
  period: number;
  state: "in" | "post";
};

export type EspnScoringPlay = {
  /** Visitor score after the play. */
  awayScore: number;
  /** Home score after the play. */
  homeScore: number;
  id: string;
  period: number;
  scoringTeamId: string;
  text: string;
  /** When the play happened, or null when ESPN did not report it. */
  wallclock: Date | null;
};

export type EspnSummary = {
  /** The latest play wallclock ESPN reported, which for a finished game is when it ended. */
  lastPlayAt: Date | null;
  scoringPlays: EspnScoringPlay[];
};

const competitorSchema = type({
  homeAway: "'home' | 'away'",
  id: "string",
  score: "string",
  team: { abbreviation: "string" },
});

const eventSchema = type({
  competitions: type({
    competitors: competitorSchema.array(),
    status: { "period?": "number", type: { state: "string" } },
  }).array(),
  id: "string",
});

const scoringPlaySchema = type({
  awayScore: "number",
  homeScore: "number",
  id: "string",
  period: { number: "number" },
  team: { id: "string" },
  "text?": "string",
  "wallclock?": "string",
});

const drivePlaySchema = type({ id: "string", "wallclock?": "string" });

const driveSchema = type({ "plays?": "unknown[]" });

const summarySchema = type({
  "drives?": { "current?": "unknown", "previous?": "unknown[]" },
  "scoringPlays?": "unknown[]",
});

const toDate = (value: string | undefined): Date | null => {
  if (value === undefined) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const toCompetitor = (competitor: typeof competitorSchema.infer): EspnCompetitor => ({
  espnTeamId: competitor.id,
  score: Number(competitor.score),
  shortName: toTeamShortName(competitor.team.abbreviation),
});

const toLiveGame = (event: unknown): EspnGame | null => {
  const parsed = eventSchema(event);

  if (parsed instanceof type.errors) {
    return null;
  }

  const competition = parsed.competitions[0];
  const state = competition?.status.type.state;
  const home = competition?.competitors.find((competitor) => competitor.homeAway === "home");
  const away = competition?.competitors.find((competitor) => competitor.homeAway === "away");

  if ((state !== "in" && state !== "post") || !home || !away) {
    return null;
  }

  return {
    away: toCompetitor(away),
    eventId: parsed.id,
    home: toCompetitor(home),
    period: competition?.status.period ?? 0,
    state,
  };
};

/**
 * The live and finished events on an ESPN scoreboard response. Events that are not started, or that do
 * not have the fields we need, are skipped so one odd event can never hide the rest.
 */
export const parseEspnScoreboard = (json: unknown): EspnGame[] => {
  const events = type({ events: "unknown[]" })(json);

  if (events instanceof type.errors) {
    return [];
  }

  return events.events.map(toLiveGame).filter((game): game is EspnGame => game !== null);
};

const getDrivePlays = (drive: unknown): Array<typeof drivePlaySchema.infer> => {
  const parsed = driveSchema(drive);

  if (parsed instanceof type.errors) {
    return [];
  }

  return (parsed.plays ?? [])
    .map((play) => drivePlaySchema(play))
    .filter((play): play is typeof drivePlaySchema.infer => !(play instanceof type.errors));
};

const getAllDrivePlays = (drives: { current?: unknown; previous?: unknown[] } | undefined) => {
  const all = [...(drives?.previous ?? []), ...(drives?.current === undefined ? [] : [drives.current])];

  return all.flatMap(getDrivePlays);
};

const getLatestDate = (dates: Array<Date | null>): Date | null =>
  dates.reduce<Date | null>((latest, date) => (date && (!latest || date > latest) ? date : latest), null);

const toScoringPlay = (play: unknown, wallclockById: Map<string, Date | null>): EspnScoringPlay | null => {
  const parsed = scoringPlaySchema(play);

  if (parsed instanceof type.errors) {
    return null;
  }

  return {
    awayScore: parsed.awayScore,
    homeScore: parsed.homeScore,
    id: parsed.id,
    period: parsed.period.number,
    scoringTeamId: parsed.team.id,
    text: parsed.text ?? "",
    wallclock: toDate(parsed.wallclock) ?? wallclockById.get(parsed.id) ?? null,
  };
};

/**
 * The scoring plays of an ESPN game summary, oldest first. ESPN only stamps a wallclock on the play records
 * inside the drives, so a scoring play's time is looked up there by id when it has none of its own.
 */
export const parseEspnSummary = (json: unknown): EspnSummary => {
  const parsed = summarySchema(json);

  if (parsed instanceof type.errors) {
    return { lastPlayAt: null, scoringPlays: [] };
  }

  const drivePlays = getAllDrivePlays(parsed.drives);
  const wallclockById = new Map(drivePlays.map((play) => [play.id, toDate(play.wallclock)]));

  return {
    lastPlayAt: getLatestDate([...wallclockById.values()]),
    scoringPlays: (parsed.scoringPlays ?? [])
      .map((play) => toScoringPlay(play, wallclockById))
      .filter((play): play is EspnScoringPlay => play !== null),
  };
};
