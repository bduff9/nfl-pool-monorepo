import {
  getFinalGameWinners,
  getPickCounts,
  getPickOfTheWeek,
  getWeeklyScoresThrough,
} from "@nfl-pool-monorepo/db/src/queries/recap";
import { addOrdinal } from "@nfl-pool-monorepo/utils/numbers";

type Scores = Awaited<ReturnType<typeof getWeeklyScoresThrough>>;
type GameWinners = Awaited<ReturnType<typeof getFinalGameWinners>>;
type PickCounts = Awaited<ReturnType<typeof getPickCounts>>;
type CorrectPicks = Awaited<ReturnType<typeof getPickOfTheWeek>>;

type Upset = { percent: number; team: string };
type PickOfTheWeek = { picks: { name: string; team: string }[]; points: number };

export type UserRecap = {
  overallPreviousRank: number | null;
  overallRank: number;
  pickOfTheWeek: PickOfTheWeek | null;
  points: number;
  rank: number;
  topScore: number;
  upset: Upset | null;
  winners: string[];
};

export type WeekRecap = {
  overall: Map<number, { previousRank: number | null; rank: number }>;
  pickOfTheWeek: PickOfTheWeek | null;
  topScore: number;
  upset: Upset | null;
  weekly: Map<number, { points: number; rank: number }>;
  winners: string[];
};

const sumPointsThrough = (scores: Scores, week: number): Map<number, number> => {
  const totals = new Map<number, number>();

  for (const score of scores.filter((row) => row.Week <= week)) {
    totals.set(score.UserID, (totals.get(score.UserID) ?? 0) + score.PointsEarned);
  }

  return totals;
};

// Competition ranking: users on the same points share a rank and the next rank skips the tied places
const rankByPoints = (totals: Map<number, number>): Map<number, number> => {
  const points = [...totals.values()];

  return new Map([...totals].map(([userId, total]) => [userId, 1 + points.filter((other) => other > total).length]));
};

const getOverallStandings = (scores: Scores, week: number) => {
  const current = rankByPoints(sumPointsThrough(scores, week));
  const previous = week > 1 ? rankByPoints(sumPointsThrough(scores, week - 1)) : new Map<number, number>();

  return new Map([...current].map(([userId, rank]) => [userId, { previousRank: previous.get(userId) ?? null, rank }]));
};

// The final game whose winner was picked by the smallest share of the pool
const findBiggestUpset = (winners: GameWinners, counts: PickCounts): Upset | null => {
  const upsets = winners
    .map((game) => {
      const total = counts.filter((count) => count.GameID === game.GameID).reduce((sum, count) => sum + count.picks, 0);
      const winning = counts.find((count) => count.GameID === game.GameID && count.TeamID === game.WinnerTeamID);

      return {
        percent: Math.round(((winning?.picks ?? 0) / total) * 100),
        team: `${game.TeamCity} ${game.TeamName}`,
        total,
      };
    })
    .filter((game) => game.total > 0)
    .sort((a, b) => a.percent - b.percent);

  return upsets[0] ? { percent: upsets[0].percent, team: upsets[0].team } : null;
};

const findPickOfTheWeek = (picks: CorrectPicks): PickOfTheWeek | null => {
  const [first] = picks;

  if (!first?.PickPoints) {
    return null;
  }

  return {
    picks: picks.map((pick) => ({
      name: `${pick.UserFirstName ?? ""} ${pick.UserLastName ?? ""}`.trim(),
      team: `${pick.TeamCity} ${pick.TeamName}`,
    })),
    points: first.PickPoints,
  };
};

export const buildWeekRecap = (
  week: number,
  scores: Scores,
  gameWinners: GameWinners,
  pickCounts: PickCounts,
  correctPicks: CorrectPicks,
): WeekRecap => {
  const thisWeek = scores.filter((row) => row.Week === week);
  const winners = thisWeek.filter((row) => row.Rank === 1);

  return {
    overall: getOverallStandings(scores, week),
    pickOfTheWeek: findPickOfTheWeek(correctPicks),
    topScore: winners[0]?.PointsEarned ?? 0,
    upset: findBiggestUpset(gameWinners, pickCounts),
    weekly: new Map(thisWeek.map((row) => [row.UserID, { points: row.PointsEarned, rank: row.Rank }])),
    winners: winners.map((row) => row.UserName),
  };
};

// Pool-wide, so it is read once per week rather than once per recipient
export const getWeekRecap = async (week: number): Promise<WeekRecap> => {
  const [scores, gameWinners, pickCounts, correctPicks] = await Promise.all([
    getWeeklyScoresThrough(week),
    getFinalGameWinners(week),
    getPickCounts(week),
    getPickOfTheWeek(week),
  ]);

  return buildWeekRecap(week, scores, gameWinners, pickCounts, correctPicks);
};

export const getUserRecap = (recap: WeekRecap | null, userId: number): UserRecap | null => {
  const weekly = recap?.weekly.get(userId);
  const overall = recap?.overall.get(userId);

  if (!recap || !weekly || !overall) {
    return null;
  }

  return {
    overallPreviousRank: overall.previousRank,
    overallRank: overall.rank,
    pickOfTheWeek: recap.pickOfTheWeek,
    points: weekly.points,
    rank: weekly.rank,
    topScore: recap.topScore,
    upset: recap.upset,
    winners: recap.winners,
  };
};

export const getRecapPushMessage = (week: number, result: { PointsEarned: number; Rank: number }): string =>
  `Week ${week} recap: you finished ${addOrdinal(result.Rank)} with ${result.PointsEarned} pts.`;

const joinNames = (names: string[]): string => {
  const last = names[names.length - 1];

  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${last}` : (last ?? "");
};

const getMovementLine = ({ overallPreviousRank, overallRank }: UserRecap): string => {
  const place = `You are ${addOrdinal(overallRank)} overall`;

  if (overallPreviousRank === null || overallPreviousRank === overallRank) {
    return `${place}.`;
  }

  const spots = Math.abs(overallPreviousRank - overallRank);
  const direction = overallRank < overallPreviousRank ? "up" : "down";

  return `${place}, ${direction} ${spots} ${spots === 1 ? "spot" : "spots"} from last week.`;
};

const getUpsetLine = (upset: Upset | null): string[] =>
  upset ? [`Biggest upset: the ${upset.team} won while only ${upset.percent}% of the pool picked them.`] : [];

const getPickOfTheWeekLine = (pick: PickOfTheWeek | null): string[] =>
  pick
    ? [
        `Pick of the week: ${pick.points} points on the ${pick.picks[0]?.team ?? ""} from ${joinNames(pick.picks.map((p) => p.name))}.`,
      ]
    : [];

export const getRecapLines = (recap: UserRecap): string[] => [
  `Week winner: ${joinNames(recap.winners)} with ${recap.topScore} points.`,
  getMovementLine(recap),
  ...getUpsetLine(recap.upset),
  ...getPickOfTheWeekLine(recap.pickOfTheWeek),
];
