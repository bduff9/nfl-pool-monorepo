import { type } from "arktype";

import { getPlayLabel, normalizePercent } from "@/lib/liveScores/espnSituation";
import { toTeamShortName } from "@/lib/liveScores/espnTeams";

/**
 * Display-only play-by-play for one game, from ESPN's unofficial summary JSON. Never persisted.
 * Every section is validated on its own and every field inside it is optional where possible: a section or an
 * item ESPN changes is dropped, never thrown on, so the rest of the page still renders.
 */
type SummaryTeam = { name: string; score: number };

export type SummaryHeader = {
  away: SummaryTeam;
  home: SummaryTeam;
  /** ISO kickoff time. */
  kickoff?: string | undefined;
  state: "in" | "post" | "pre";
  /** ESPN's short status such as "7:01 - 3rd" or "Final". */
  statusText?: string | undefined;
};

export type SummaryPlay = {
  clock?: string | undefined;
  downDistance?: string | undefined;
  id: string;
  isScoring: boolean;
  isTurnover: boolean;
  label?: string | undefined;
  period?: number | undefined;
  text: string;
};

export type SummaryDrive = {
  id: string;
  /** "BUF · 8 plays, 62 yds, 4:11 · Touchdown", whatever parts ESPN supplied. */
  headline: string;
  /** Newest play first. */
  plays: SummaryPlay[];
};

export type SummaryScoringPlay = {
  awayScore?: number | undefined;
  clock?: string | undefined;
  homeScore?: number | undefined;
  id: string;
  period?: number | undefined;
  team?: string | undefined;
  text: string;
  type?: string | undefined;
};

export type LiveGameSummary = {
  currentDrive?: SummaryDrive | undefined;
  header?: SummaryHeader | undefined;
  /** Newest drive first. */
  previousDrives: SummaryDrive[];
  /** Newest first. */
  scoringPlays: SummaryScoringPlay[];
  /** Home win probability (0-100) after each play, oldest first. */
  winProbability: number[];
};

const EspnSummarySchema = type({
  "drives?": { "current?": "unknown", "previous?": "unknown[]" },
  "header?": "unknown",
  "scoringPlays?": "unknown[]",
  "winprobability?": "unknown[]",
});

const HeaderSchema = type({
  competitions: type({
    "competitors?": type({
      homeAway: "'home' | 'away'",
      "score?": "string",
      team: { "abbreviation?": "string", "shortDisplayName?": "string" },
    }).array(),
    "date?": "string",
    status: { type: { "detail?": "string", "shortDetail?": "string", state: "string" } },
  }).array(),
});

const PlaySchema = type({
  "awayScore?": "number",
  "clock?": { "displayValue?": "string" },
  id: "string",
  "isTurnover?": "boolean",
  "period?": { "number?": "number" },
  "scoringPlay?": "boolean",
  "start?": { "downDistanceText?": "string" },
  "text?": "string",
  "type?": { "abbreviation?": "string", "text?": "string" },
});

const DriveSchema = type({
  "description?": "string",
  "displayResult?": "string",
  id: "string",
  "plays?": "unknown[]",
  "team?": { "abbreviation?": "string" },
});

const ScoringPlaySchema = type({
  "awayScore?": "number",
  "clock?": { "displayValue?": "string" },
  "homeScore?": "number",
  id: "string",
  "period?": { "number?": "number" },
  "scoringType?": { "displayName?": "string" },
  "team?": { "abbreviation?": "string" },
  "text?": "string",
});

const WinProbabilitySchema = type({ homeWinPercentage: "number" });

const isDefined = <T>(value: T | undefined): value is T => value !== undefined;

const parseWith = <T>(items: unknown[] | undefined, parse: (item: unknown) => T | undefined): T[] =>
  (items ?? []).map(parse).filter(isDefined);

type EspnPlay = typeof PlaySchema.infer;
type PlayLabel = ReturnType<typeof getPlayLabel>;

const getLabel = (play: EspnPlay): PlayLabel => getPlayLabel(play.type?.text, play.type?.abbreviation);

const isTurnover = (play: EspnPlay, label: PlayLabel): boolean => play.isTurnover ?? label?.isTurnover ?? false;

const toPlay = (raw: unknown): SummaryPlay | undefined => {
  const play = PlaySchema(raw);

  if (play instanceof type.errors || !play.text) {
    return undefined;
  }

  const label = getLabel(play);

  return {
    clock: play.clock?.displayValue,
    downDistance: play.start?.downDistanceText,
    id: play.id,
    isScoring: play.scoringPlay === true,
    isTurnover: isTurnover(play, label),
    label: label?.label,
    period: play.period?.number,
    text: play.text,
  };
};

const toHeadline = (drive: typeof DriveSchema.infer): string => {
  const team = drive.team?.abbreviation ? toTeamShortName(drive.team.abbreviation) : undefined;
  const description = drive.description?.replace(/\byards?\b/, "yds");

  return [team, description, drive.displayResult].filter(Boolean).join(" · ");
};

const toDrive = (raw: unknown): SummaryDrive | undefined => {
  const drive = DriveSchema(raw);

  if (drive instanceof type.errors) {
    return undefined;
  }

  return { headline: toHeadline(drive), id: drive.id, plays: parseWith(drive.plays, toPlay).toReversed() };
};

const toScoringPlay = (raw: unknown): SummaryScoringPlay | undefined => {
  const play = ScoringPlaySchema(raw);

  if (play instanceof type.errors || !play.text) {
    return undefined;
  }

  return {
    awayScore: play.awayScore,
    clock: play.clock?.displayValue,
    homeScore: play.homeScore,
    id: play.id,
    period: play.period?.number,
    team: play.team?.abbreviation ? toTeamShortName(play.team.abbreviation) : undefined,
    text: play.text,
    type: play.scoringType?.displayName,
  };
};

const toWinProbability = (raw: unknown): number | undefined => {
  const point = WinProbabilitySchema(raw);

  return point instanceof type.errors ? undefined : normalizePercent(point.homeWinPercentage);
};

const toState = (state: string): SummaryHeader["state"] => (state === "in" || state === "post" ? state : "pre");

const toTeam = (
  competitor: { score?: string; team: { abbreviation?: string } } | undefined,
): SummaryTeam | undefined => {
  if (!competitor?.team.abbreviation) {
    return undefined;
  }

  return { name: toTeamShortName(competitor.team.abbreviation), score: Number(competitor.score ?? 0) || 0 };
};

const toHeader = (raw: unknown): SummaryHeader | undefined => {
  const header = HeaderSchema(raw);

  if (header instanceof type.errors) {
    return undefined;
  }

  const competition = header.competitions[0];
  const home = toTeam(competition?.competitors?.find((competitor) => competitor.homeAway === "home"));
  const away = toTeam(competition?.competitors?.find((competitor) => competitor.homeAway === "away"));

  if (!(competition && home && away)) {
    return undefined;
  }

  return {
    away,
    home,
    kickoff: competition.date,
    state: toState(competition.status.type.state),
    statusText: competition.status.type.shortDetail ?? competition.status.type.detail,
  };
};

const EMPTY_SUMMARY: LiveGameSummary = { previousDrives: [], scoringPlays: [], winProbability: [] };

/**
 * Parses an ESPN game summary payload. Never throws: anything that does not match the expected shape is left out,
 * and a payload that is not an object at all yields an empty summary.
 */
export const parseEspnSummary = (payload: unknown): LiveGameSummary => {
  const summary = EspnSummarySchema(payload);

  if (summary instanceof type.errors) {
    return EMPTY_SUMMARY;
  }

  return {
    currentDrive: summary.drives?.current ? toDrive(summary.drives.current) : undefined,
    header: toHeader(summary.header),
    previousDrives: parseWith(summary.drives?.previous, toDrive).toReversed(),
    scoringPlays: parseWith(summary.scoringPlays, toScoringPlay).toReversed(),
    winProbability: parseWith(summary.winprobability, toWinProbability),
  };
};
