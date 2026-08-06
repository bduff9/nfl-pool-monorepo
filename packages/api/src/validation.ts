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
import { type } from "arktype";

const IntBooleanSchema = type("'0' | '1'");

const PositiveIntegerStringSchema = type("string | number").pipe((s) => {
  if (typeof s === "number") return s;
  if (s === "") return 0;
  return parseInt(s, 10);
}, type("number.integer >= 0"));

const NumericStringSchema = type("string | number").pipe((s) => {
  if (typeof s === "number") return s;
  if (s === "") return 0;
  return Number(s);
}, type("number"));

const TeamIdSchema = type.enumerated(
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
);

const TeamSchema = type({
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
export type ApiTeam = typeof TeamSchema.infer;

const StatusSchema = type("'SCHED' | 'INPROG' | 'FINAL'");

const GameSecondsRemainingSchema = type("string | number").pipe((s) => {
  if (typeof s === "number") return s;
  if (s === "") return 0;
  return parseInt(s, 10);
}, type("0 <= number <= 3600"));

const DateStringSchema = type("string | number | Date").pipe((d) => {
  if (d instanceof Date) return d;
  const date = new Date(0);
  const epoch = parseInt(String(d), 10);
  date.setUTCSeconds(epoch);
  return date;
}, type("Date"));

const QuarterSchema = type("'1st Quarter' | '2nd Quarter' | 'Half Time' | '3rd Quarter' | '4th Quarter' | 'Overtime'");

const MatchupSchema = type({
  gameSecondsRemaining: GameSecondsRemainingSchema,
  kickoff: DateStringSchema,
  "quarter?": QuarterSchema,
  "quarterTimeRemaining?": "string",
  "status?": StatusSchema,
  team: TeamSchema.array(),
});
export type ApiMatchup = typeof MatchupSchema.infer;

const MAX_WEEK = WEEKS_IN_SEASON + PLAYOFF_WEEKS;
const WeekSchema = type("string | number").pipe(
  (s) => {
    if (typeof s === "number") return s;
    if (s === "") return 0;
    return parseInt(s, 10);
  },
  type(`1 <= number.integer <= ${MAX_WEEK}`),
);

/**
 * This is needed since the API returns an object instead of an
 * array for the super bowl.  Really, really stupid since it breaks
 * the api contract but it is what it is.
 */
const FixMatchupSchema = type("unknown").pipe((m) => {
  if (m && Array.isArray(m)) return m;
  return [m];
}, MatchupSchema.array());

const NFLWeekSchema = type({
  "lastUpdate?": DateStringSchema,
  matchup: FixMatchupSchema,
  week: WeekSchema,
});

export const SingleWeekResponseSchema = type({
  encoding: "'utf-8'",
  nflSchedule: NFLWeekSchema,
  version: "'1.0'",
});

const NFLWeekArrayItemSchema = type({
  "lastUpdate?": DateStringSchema,
  "matchup?": FixMatchupSchema,
  week: WeekSchema,
});

const NFLWeekArraySchema = NFLWeekArrayItemSchema.array();
export type NFLWeekArray = typeof NFLWeekArraySchema.infer;

const NFLScheduleSchema = type({
  nflSchedule: NFLWeekArraySchema,
});

export const EntireSeasonResponseSchema = type({
  encoding: "'utf-8'",
  fullNflSchedule: NFLScheduleSchema,
  version: "'1.0'",
});

const newsArticleSchema = type({
  author: "string | null",
  content: "string",
  description: "string",
  publishedAt: type("string | number | Date").pipe((d) => new Date(d)),
  source: {
    id: "string | null",
    name: "string",
  },
  title: "string",
  url: "string",
  urlToImage: "string | null",
});

export type APINewsArticle = typeof newsArticleSchema.infer;

export const newsArticlesSchema = type({
  articles: newsArticleSchema.array(),
  status: "string",
  totalResults: "number",
});
