import { addOrdinal } from "@nfl-pool-monorepo/utils/numbers";

export const buildWeekResultShareText = (week: number, rank: number, tied: boolean): string =>
  `I finished ${tied ? "tied for " : ""}${addOrdinal(rank)} in week ${week} of the NFL Confidence Pool`;

export const buildWeekPicksShareText = (week: number): string => `My week ${week} picks are in`;

export const formatRankLabel = (rank: number, total: number, tied: boolean): string =>
  `${tied ? "T-" : ""}${addOrdinal(rank)} of ${total}`;
