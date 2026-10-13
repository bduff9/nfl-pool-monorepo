import { type } from "arktype";

import { type LiveSituation, parseSituationCore, parseSituationDetail } from "./espnSituation";
import { toTeamShortName } from "./espnTeams";

/**
 * Display-only live score for one in-progress game, derived from ESPN's unofficial scoreboard JSON.
 * Never persisted - the official API (via the database) stays the source of truth for scoring.
 */
export type LiveScore = {
  clock: string;
  detail: string;
  /** ESPN's event id, used to link to the game detail page; undefined if ESPN omits it. */
  eventId?: string | undefined;
  /** ESPN reports the game over; shown as an unofficial final until the official API marks it final. */
  final: boolean;
  homeScore: number;
  /** ESPN's red zone flag for the team with the ball. */
  inRedZone: boolean;
  period: number;
  /** Which side has the ball, from ESPN's live situation; null between possessions or when not reported. */
  possession: "home" | "visitor" | null;
  /** Down & distance, timeouts, last play and win probability; undefined when ESPN sends no usable situation. */
  situation?: LiveSituation | undefined;
  visitorScore: number;
};

/** Keyed by `${visitorShortName}@${homeShortName}` using our TeamShortName codes. */
export type LiveScoreMap = Record<string, LiveScore>;

// Unknown keys are ignored by arktype, so the many other fields ESPN sends are tolerated.
const EspnScoreboardSchema = type({
  events: type({
    competitions: type({
      competitors: type({
        homeAway: "'home' | 'away'",
        "id?": "string",
        score: "string",
        team: { abbreviation: "string" },
      }).array(),
      // Only present while a game is in progress. Validated separately (see espnSituation.ts) so that a change to
      // any of its optional detail never invalidates the score overlay itself.
      "situation?": "unknown",
    }).array(),
    "id?": "string",
    status: {
      displayClock: "string",
      period: "number",
      type: { shortDetail: "string", state: "string" },
    },
  }).array(),
});

type EspnEvent = (typeof EspnScoreboardSchema.infer)["events"][number];
type EspnCompetitor = EspnEvent["competitions"][number]["competitors"][number];

// Possession is the ESPN team id of the competitor with the ball
const getPossession = (
  possession: string | undefined,
  home: EspnCompetitor,
  visitor: EspnCompetitor,
): LiveScore["possession"] => {
  if (!possession) {
    return null;
  }

  const sides = { [home.id ?? "home"]: "home", [visitor.id ?? "visitor"]: "visitor" } as const;

  return sides[possession] ?? null;
};

export const getLiveScoreKey = (visitorShortName: string, homeShortName: string): string =>
  `${visitorShortName}@${homeShortName}`;

const toLiveScoreEntry = (event: EspnEvent): [string, LiveScore] | null => {
  const competition = event.competitions[0];
  const competitors = competition?.competitors ?? [];
  const home = competitors.find((competitor: EspnCompetitor) => competitor.homeAway === "home");
  const visitor = competitors.find((competitor: EspnCompetitor) => competitor.homeAway === "away");

  if (!home || !visitor) {
    return null;
  }

  const { isRedZone, possession } = parseSituationCore(competition?.situation);

  return [
    getLiveScoreKey(toTeamShortName(visitor.team.abbreviation), toTeamShortName(home.team.abbreviation)),
    {
      clock: event.status.displayClock,
      detail: event.status.type.shortDetail,
      eventId: event.id,
      final: event.status.type.state === "post",
      homeScore: Number(home.score),
      inRedZone: isRedZone,
      period: event.status.period,
      possession: getPossession(possession, home, visitor),
      situation: parseSituationDetail(competition?.situation),
      visitorScore: Number(visitor.score),
    },
  ];
};

// "in" includes halftime. "post" is kept so a just-finished game doesn't fall back to the official feed's older score
// while that feed (which updates about every 15 minutes) catches up; the overlay only applies to games the database
// has not marked final yet, so the official result always wins once it arrives.
const OVERLAY_STATES = new Set(["in", "post"]);

/**
 * Validates an ESPN scoreboard payload and returns live scores for games ESPN reports as in progress or just
 * finished. Pre-game games are omitted. Throws when the payload does not match the expected shape.
 */
export const parseEspnScoreboard = (payload: unknown): LiveScoreMap => {
  const parsed = EspnScoreboardSchema(payload);

  if (parsed instanceof type.errors) {
    throw new Error(`ESPN scoreboard schema mismatch: ${parsed.summary}`);
  }

  const entries = parsed.events
    .filter((event) => OVERLAY_STATES.has(event.status.type.state))
    .map(toLiveScoreEntry)
    .filter((entry): entry is [string, LiveScore] => entry !== null)
    .filter(([, score]) => Number.isFinite(score.homeScore) && Number.isFinite(score.visitorScore));

  return Object.fromEntries(entries);
};
