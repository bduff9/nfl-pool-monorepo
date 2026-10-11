import { WEEKS_IN_SEASON } from "@nfl-pool-monorepo/utils/constants";
import { sql } from "kysely";

type TeamParts = { TeamCity: null | string; TeamLogo: null | string; TeamName: null | string };

export const toLastPickTeam = ({ TeamCity, TeamLogo, TeamName }: TeamParts) => {
  if (TeamName && TeamCity && TeamLogo) {
    return { TeamCity, TeamLogo, TeamName };
  }

  return undefined;
};

export const isSurvivorComplete = (alive: { WeeksAlive: number }[]) =>
  alive.length < 2 || alive[0]?.WeeksAlive === WEEKS_IN_SEASON;

export const toMaxWeek = (result: undefined | { max: null | number }) => result?.max ?? 0;

export const deadCountSql = (week: number, maxWeek: number) =>
  week < maxWeek
    ? sql`CASE WHEN WeeksAlive = ${week} THEN 1 ELSE 0 END`
    : sql`CASE WHEN CurrentStatus = 'Dead' THEN 1 ELSE 0 END`;
