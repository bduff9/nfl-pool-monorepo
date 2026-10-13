import { type } from "arktype";

/**
 * Display-only detail for one in-progress game, from the `situation` block of ESPN's scoreboard JSON.
 * Every field is optional: when ESPN drops or changes one, that line just disappears from the live strip.
 */
export type LastPlay = {
  id?: string | undefined;
  isScoring: boolean;
  isTurnover: boolean;
  /** Short uppercase tag such as "TOUCHDOWN" or "INTERCEPTION", when the play type is recognised. */
  label?: string | undefined;
  text: string;
};

export type LiveSituation = {
  awayTimeouts?: number | undefined;
  ballSpot?: string | undefined;
  downDistance?: string | undefined;
  drive?: string | undefined;
  /** 0-100, rounded. */
  homeWinPct?: number | undefined;
  homeTimeouts?: number | undefined;
  lastPlay?: LastPlay | undefined;
};

type PlayLabelRule = { isTurnover: boolean; label: string; pattern: RegExp };

// First match wins, so the more specific patterns come first. Patterns run against ESPN's play type text and
// abbreviation (e.g. "Rushing Touchdown TD", "Fumble Recovery (Opponent)").
const PLAY_LABEL_RULES: PlayLabelRule[] = [
  {
    isTurnover: false,
    label: "MISSED FIELD GOAL",
    pattern: /(missed|blocked) field goal|field goal missed|\bFGM\b|\bBFG\b/i,
  },
  { isTurnover: true, label: "INTERCEPTION", pattern: /interception|\bINTR?\b/i },
  { isTurnover: false, label: "TOUCHDOWN", pattern: /touchdown|\bTD\b/i },
  { isTurnover: false, label: "FIELD GOAL", pattern: /field goal|\bFG\b/i },
  { isTurnover: false, label: "SAFETY", pattern: /safety/i },
  { isTurnover: true, label: "FUMBLE", pattern: /fumble recovery \(opponent\)/i },
  { isTurnover: false, label: "FUMBLE", pattern: /fumble/i },
];

export const getPlayLabel = (
  typeText: string | undefined,
  abbreviation: string | undefined,
): { isTurnover: boolean; label: string } | undefined => {
  const haystack = `${typeText ?? ""} ${abbreviation ?? ""}`;
  const rule = PLAY_LABEL_RULES.find(({ pattern }) => pattern.test(haystack));

  return rule ? { isTurnover: rule.isTurnover, label: rule.label } : undefined;
};

/** ESPN reports win probability as a 0-1 fraction; a value above 1 is taken to already be a percentage. */
export const normalizePercent = (value: number): number => (value <= 1 ? value * 100 : value);

const EspnLastPlaySchema = type({
  "drive?": { "description?": "string" },
  "id?": "string",
  "probability?": { "homeWinPercentage?": "number" },
  "scoreValue?": "number",
  "text?": "string",
  "type?": { "abbreviation?": "string", "text?": "string" },
});

// Each block of `situation` is validated on its own, so a wrong type in one never discards the others.
const EspnSituationCoreSchema = type({ "isRedZone?": "boolean", "possession?": "string" });
const EspnSituationDetailSchema = type({
  "awayTimeouts?": "number",
  "homeTimeouts?": "number",
  "lastPlay?": "unknown",
  "possessionText?": "string",
  "shortDownDistanceText?": "string",
});

type EspnLastPlay = typeof EspnLastPlaySchema.infer;

const toLastPlay = (play: EspnLastPlay): LastPlay | undefined => {
  if (!play.text) {
    return undefined;
  }

  const label = getPlayLabel(play.type?.text, play.type?.abbreviation);

  return {
    id: play.id,
    isScoring: (play.scoreValue ?? 0) > 0,
    isTurnover: label?.isTurnover ?? false,
    label: label?.label,
    text: play.text,
  };
};

const parseLastPlay = (raw: unknown): EspnLastPlay | undefined => {
  const parsed = EspnLastPlaySchema(raw);

  return parsed instanceof type.errors ? undefined : parsed;
};

const toRoundedWinPct = (play: EspnLastPlay | undefined): number | undefined => {
  const fraction = play?.probability?.homeWinPercentage;

  return fraction === undefined ? undefined : Math.round(normalizePercent(fraction));
};

const parseDetail = (raw: unknown): typeof EspnSituationDetailSchema.infer => {
  const parsed = EspnSituationDetailSchema(raw);

  return parsed instanceof type.errors ? {} : parsed;
};

const hasValues = (situation: LiveSituation): boolean => Object.values(situation).some((value) => value !== undefined);

/** The live strip's detail for a scoreboard `situation` block; undefined when nothing usable is present. */
export const parseSituationDetail = (raw: unknown): LiveSituation | undefined => {
  const detail = parseDetail(raw);
  const play = parseLastPlay(detail.lastPlay);
  const situation: LiveSituation = {
    awayTimeouts: detail.awayTimeouts,
    ballSpot: detail.possessionText,
    downDistance: detail.shortDownDistanceText,
    drive: play?.drive?.description,
    homeTimeouts: detail.homeTimeouts,
    homeWinPct: toRoundedWinPct(play),
    lastPlay: play ? toLastPlay(play) : undefined,
  };

  return hasValues(situation) ? situation : undefined;
};

/** Possession and red zone, the two situation fields that already drive the scoreboard card. */
export const parseSituationCore = (raw: unknown): { isRedZone: boolean; possession?: string | undefined } => {
  const parsed = EspnSituationCoreSchema(raw);

  return parsed instanceof type.errors
    ? { isRedZone: false }
    : { isRedZone: parsed.isRedZone === true, possession: parsed.possession };
};
