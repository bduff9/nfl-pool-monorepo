import { type } from "arktype";

import { toTeamShortName } from "./espnTeams";

/**
 * Display-only live score for one in-progress game, derived from ESPN's unofficial scoreboard JSON.
 * Never persisted - the official API (via the database) stays the source of truth for scoring.
 */
export type LiveScore = {
  clock: string;
  detail: string;
  /** ESPN reports the game over; shown as an unofficial final until the official API marks it final. */
  final: boolean;
  homeScore: number;
  period: number;
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
        score: "string",
        team: { abbreviation: "string" },
      }).array(),
    }).array(),
    status: {
      displayClock: "string",
      period: "number",
      type: { shortDetail: "string", state: "string" },
    },
  }).array(),
});

type EspnEvent = (typeof EspnScoreboardSchema.infer)["events"][number];
type EspnCompetitor = EspnEvent["competitions"][number]["competitors"][number];

export const getLiveScoreKey = (visitorShortName: string, homeShortName: string): string =>
  `${visitorShortName}@${homeShortName}`;

const toLiveScoreEntry = (event: EspnEvent): [string, LiveScore] | null => {
  const competitors = event.competitions[0]?.competitors ?? [];
  const home = competitors.find((competitor: EspnCompetitor) => competitor.homeAway === "home");
  const visitor = competitors.find((competitor: EspnCompetitor) => competitor.homeAway === "away");

  if (!home || !visitor) {
    return null;
  }

  return [
    getLiveScoreKey(toTeamShortName(visitor.team.abbreviation), toTeamShortName(home.team.abbreviation)),
    {
      clock: event.status.displayClock,
      detail: event.status.type.shortDetail,
      final: event.status.type.state === "post",
      homeScore: Number(home.score),
      period: event.status.period,
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
