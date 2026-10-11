import { db } from "@nfl-pool-monorepo/db/src/kysely";

type TeamLabel = { TeamCity: string; TeamName: string };

// The home and visitor teams of the week's first game, as shown by the week started and quick pick notifications.
export const getFirstGameTeams = async (week: number) => {
  const [homeTeam, visitorTeam] = await Promise.all([
    db
      .selectFrom("Teams as t")
      .select(["t.TeamID", "t.TeamCity", "t.TeamName", "t.TeamPrimaryColor", "t.TeamSecondaryColor"])
      .innerJoin("Games as g", "g.HomeTeamID", "t.TeamID")
      .where("g.GameWeek", "=", week)
      .where("g.GameNumber", "=", 1)
      .executeTakeFirstOrThrow(),
    db
      .selectFrom("Teams as t")
      .select(["t.TeamID", "t.TeamCity", "t.TeamName", "t.TeamPrimaryColor", "t.TeamSecondaryColor"])
      .innerJoin("Games as g", "g.VisitorTeamID", "t.TeamID")
      .where("g.GameWeek", "=", week)
      .where("g.GameNumber", "=", 1)
      .executeTakeFirstOrThrow(),
  ]);

  return { homeTeam, visitorTeam };
};

export const getWeekStartedMessage = (
  firstName: string | null,
  week: number,
  { homeTeam, visitorTeam }: { homeTeam: TeamLabel; visitorTeam: TeamLabel },
): string =>
  `${firstName}, week ${week} has just started with ${visitorTeam.TeamCity} ${visitorTeam.TeamName} @ ${homeTeam.TeamCity} ${homeTeam.TeamName}`;

// The teams and score of the week's last game, as shown by the week ended notifications.
export const getWeekEndedResult = async (week: number) => {
  const [homeTeam, visitorTeam, winnerTeam] = await Promise.all([
    db
      .selectFrom("Teams as t")
      .innerJoin("Games as g", "g.HomeTeamID", "t.TeamID")
      .select([
        "g.GameHomeScore",
        "g.GameVisitorScore",
        "t.TeamCity",
        "t.TeamName",
        "t.TeamPrimaryColor",
        "t.TeamSecondaryColor",
      ])
      .where("g.GameWeek", "=", week)
      .orderBy("GameKickoff", "desc")
      .executeTakeFirstOrThrow(),
    db
      .selectFrom("Teams as t")
      .select(["t.TeamCity", "t.TeamName", "t.TeamPrimaryColor", "t.TeamSecondaryColor"])
      .innerJoin("Games as g", "g.VisitorTeamID", "t.TeamID")
      .where("g.GameWeek", "=", week)
      .orderBy("GameKickoff", "desc")
      .executeTakeFirstOrThrow(),
    db
      .selectFrom("Teams as t")
      .select(["t.TeamCity", "t.TeamName", "t.TeamPrimaryColor", "t.TeamSecondaryColor"])
      .innerJoin("Games as g", "g.WinnerTeamID", "t.TeamID")
      .where("g.GameWeek", "=", week)
      .orderBy("GameKickoff", "desc")
      .executeTakeFirstOrThrow(),
  ]);
  const [winnerScore, loserScore] =
    homeTeam.GameHomeScore > homeTeam.GameVisitorScore
      ? [homeTeam.GameHomeScore, homeTeam.GameVisitorScore]
      : [homeTeam.GameVisitorScore, homeTeam.GameHomeScore];

  return { homeTeam, loserScore, visitorTeam, winnerScore, winnerTeam };
};

export const getWeekEndedMessage = (
  firstName: string | null,
  week: number,
  {
    homeTeam,
    loserScore,
    visitorTeam,
    winnerScore,
    winnerTeam,
  }: { homeTeam: TeamLabel; loserScore: number; visitorTeam: TeamLabel; winnerScore: number; winnerTeam: TeamLabel },
): string => {
  const intro = `${firstName}, week ${week} has just ended with ${visitorTeam.TeamCity} ${visitorTeam.TeamName} @ ${homeTeam.TeamCity} ${homeTeam.TeamName}. `;

  if (winnerScore === loserScore) {
    return `${intro}The game ended in a tie, ${winnerScore} - ${loserScore}.`;
  }

  return `${intro}The ${winnerTeam.TeamName} won with a score of ${winnerScore} - ${loserScore}.`;
};
