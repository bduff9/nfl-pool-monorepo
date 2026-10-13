import { type } from "arktype";

import { toTeamShortName } from "./espnTeams";
import { getLiveScoreKey } from "./parseEspn";

/** Keyed by `${visitorShortName}@${homeShortName}` using our TeamShortName codes; values are ESPN event ids. */
export type EspnEventIdMap = Record<string, string>;

// Unknown keys are ignored by arktype, so the many other fields ESPN sends are tolerated.
const EspnEventsSchema = type({
  events: type({
    competitions: type({
      competitors: type({
        homeAway: "'home' | 'away'",
        team: { abbreviation: "string" },
      }).array(),
    }).array(),
    id: "string",
  }).array(),
});

type EspnEvent = (typeof EspnEventsSchema.infer)["events"][number];
type EspnCompetitor = EspnEvent["competitions"][number]["competitors"][number];

const getShortName = (competitors: EspnCompetitor[], side: EspnCompetitor["homeAway"]): string | undefined => {
  const competitor = competitors.find((candidate) => candidate.homeAway === side);

  return competitor ? toTeamShortName(competitor.team.abbreviation) : undefined;
};

const toEventIdEntry = (event: EspnEvent): [string, string] | null => {
  const competitors = event.competitions[0]?.competitors ?? [];
  const home = getShortName(competitors, "home");
  const visitor = getShortName(competitors, "away");

  return home && visitor ? [getLiveScoreKey(visitor, home), event.id] : null;
};

/**
 * Validates an ESPN scoreboard payload and maps each matchup to its event id, whatever the game's state.
 * Throws when the payload does not match the expected shape.
 */
export const parseEspnEventIds = (payload: unknown): EspnEventIdMap => {
  const parsed = EspnEventsSchema(payload);

  if (parsed instanceof type.errors) {
    throw new Error(`ESPN event id schema mismatch: ${parsed.summary}`);
  }

  const entries = parsed.events.map(toEventIdEntry).filter((entry): entry is [string, string] => entry !== null);

  return Object.fromEntries(entries);
};
