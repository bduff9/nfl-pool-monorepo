/*******************************************************************************
 * NFL Confidence Pool BE - the backend implementation of an NFL confidence pool.
 * Copyright (C) 2015-present Brian Duffey
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see {http://www.gnu.org/licenses/}.
 * Home: https://asitewithnoname.com/
 */
import { PLAYOFF_WEEKS, WEEKS_IN_SEASON } from "@nfl-pool-monorepo/utils/constants";
import { z } from "zod";

const IntBooleanSchema = z.enum(["0", "1"]);

const PositiveIntegerStringSchema = z.preprocess((s): number | undefined => {
  if (typeof s === "number") return s;

  if (typeof s !== "string") return undefined;

  if (s === "") return 0;

  return parseInt(s, 10);
}, z.number().int().nonnegative());

const NumericStringSchema = z.preprocess((s): number | undefined => {
  if (typeof s === "number") return s;

  if (typeof s !== "string") return undefined;

  if (s === "") return 0;

  return Number(s);
}, z.number());

const TeamIdSchema = z.enum([
  "ARI",
  "ATL",
  "BAL",
  "BUF",
  "CAR",
  "CHI",
  "CIN",
  "CLE",
  "DAL",
  "DEN",
  "DET",
  "GBP",
  "HOU",
  "IND",
  "JAC",
  "KCC",
  "LAC",
  "LAR",
  "LVR",
  "MIA",
  "MIN",
  "NEP",
  "NOS",
  "NYG",
  "NYJ",
  "PHI",
  "PIT",
  "SEA",
  "SFO",
  "TBB",
  "TEN",
  "WAS",
]);

const TeamSchema = z.object({
  hasPossession: IntBooleanSchema,
  id: TeamIdSchema,
  inRedZone: IntBooleanSchema,
  isHome: IntBooleanSchema,
  passDefenseRank: PositiveIntegerStringSchema,
  passOffenseRank: PositiveIntegerStringSchema,
  rushDefenseRank: PositiveIntegerStringSchema,
  rushOffenseRank: PositiveIntegerStringSchema,
  score: PositiveIntegerStringSchema,
  spread: NumericStringSchema,
});
export type ApiTeam = z.infer<typeof TeamSchema>;

const StatusSchema = z.enum(["SCHED", "INPROG", "FINAL"]);

const GameSecondsRemainingSchema = z.preprocess((s): number | undefined => {
  if (typeof s === "number") return s;

  if (typeof s !== "string") return undefined;

  if (s === "") return 0;

  return parseInt(s, 10);
}, z.number().nonnegative().max(3600));

const DateStringSchema = z.preprocess((d): Date | undefined => {
  if (d instanceof Date) return d;

  if (typeof d !== "string") return undefined;

  const date = new Date(0);
  const epoch = parseInt(d, 10);

  date.setUTCSeconds(epoch);

  return date;
}, z.date());

const QuarterSchema = z.enum(["1st Quarter", "2nd Quarter", "Half Time", "3rd Quarter", "4th Quarter", "Overtime"]);

const MatchupSchema = z.object({
  gameSecondsRemaining: GameSecondsRemainingSchema,
  kickoff: DateStringSchema,
  quarter: QuarterSchema.optional(),
  quarterTimeRemaining: z.string().optional(),
  status: StatusSchema.optional(),
  team: z.array(TeamSchema),
});
export type ApiMatchup = z.infer<typeof MatchupSchema>;

const WeekSchema = z.preprocess(
  (s): number | undefined => {
    if (typeof s === "number") return s;

    if (typeof s !== "string") return undefined;

    if (s === "") return 0;

    return parseInt(s, 10);
  },
  z
    .number()
    .int()
    .positive()
    .min(1)
    .max(WEEKS_IN_SEASON + PLAYOFF_WEEKS),
);

/**
 * This is needed since the API returns an object instead of an
 * array for the super bowl.  Really, really stupid since it breaks
 * the api contract but it is what it is.
 */
const FixMatchupSchema = z.preprocess((m) => {
  if (m && Array.isArray(m)) return m;

  return [m];
}, z.array(MatchupSchema));

const NFLWeekSchema = z.object({
  lastUpdate: DateStringSchema.optional(),
  matchup: FixMatchupSchema,
  week: WeekSchema,
});

export const SingleWeekResponseSchema = z.object({
  encoding: z.literal("utf-8"),
  nflSchedule: NFLWeekSchema,
  version: z.literal("1.0"),
});
export type SingleWeekResponse = z.infer<typeof SingleWeekResponseSchema>;

const NFLWeekArraySchema = z.array(
  z.object({
    lastUpdate: DateStringSchema.optional(),
    matchup: FixMatchupSchema.optional(),
    week: WeekSchema,
  }),
);
export type NFLWeekArray = z.infer<typeof NFLWeekArraySchema>;

const NFLScheduleSchema = z.object({
  nflSchedule: NFLWeekArraySchema,
});

export const EntireSeasonResponseSchema = z.object({
  encoding: z.literal("utf-8"),
  fullNflSchedule: NFLScheduleSchema,
  version: z.literal("1.0"),
});
export type EntireSeasonResponse = z.infer<typeof EntireSeasonResponseSchema>;

const newsArticleSchema = z.object({
  author: z.string().nullable(),
  content: z.string(),
  description: z.string(),
  publishedAt: z.coerce.date(),
  source: z.object({
    id: z.string().nullable(),
    name: z.string(),
  }),
  title: z.string(),
  url: z.string(),
  urlToImage: z.string().nullable(),
});

export type APINewsArticle = z.infer<typeof newsArticleSchema>;

export const newsArticlesSchema = z.object({
  articles: z.array(newsArticleSchema),
  status: z.string(),
  totalResults: z.number(),
});
