import { getTeamsByShortNames } from "@nfl-pool-monorepo/db/src/queries/team";
import { cacheLife } from "next/cache";
import "server-only";

import { toTeamShortName } from "@/lib/liveScores/espnTeams";

export type GameTeam = Awaited<ReturnType<typeof getTeamsByShortNames>>[number];

export type GameTeams = { away: GameTeam | null; home: GameTeam | null };

/** Our team rows (logo and colors) for the two ESPN abbreviations on a game page. Team data rarely changes. */
const getGameTeams = async (homeAbbreviation: string, awayAbbreviation: string): Promise<GameTeams> => {
  "use cache";
  cacheLife("days");

  const home = toTeamShortName(homeAbbreviation);
  const away = toTeamShortName(awayAbbreviation);
  const teams = await getTeamsByShortNames([home, away]);
  const find = (shortName: string): GameTeam | null => teams.find((team) => team.TeamShortName === shortName) ?? null;

  return { away: find(away), home: find(home) };
};

const NO_TEAMS: GameTeams = { away: null, home: null };

/** Team rows for a game page's summary header, or no teams when the summary is unavailable. */
export const getGameTeamsForHeader = (header: { away: { name: string }; home: { name: string } } | undefined) =>
  header ? getGameTeams(header.home.name, header.away.name) : Promise.resolve(NO_TEAMS);
