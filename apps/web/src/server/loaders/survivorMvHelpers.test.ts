import type { DB } from "@nfl-pool-monorepo/db/src";
import { WEEKS_IN_SEASON } from "@nfl-pool-monorepo/utils/constants";
import { DummyDriver, Kysely, MysqlAdapter, MysqlIntrospector, MysqlQueryCompiler } from "kysely";
import { describe, expect, it } from "vitest";

import { deadCountSql, isSurvivorComplete, toLastPickTeam, toMaxWeek } from "./survivorMvHelpers";

const db = new Kysely<DB>({
  dialect: {
    createAdapter: () => new MysqlAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (kysely) => new MysqlIntrospector(kysely),
    createQueryCompiler: () => new MysqlQueryCompiler(),
  },
});

describe("toLastPickTeam", () => {
  it("returns the team when all parts exist", () => {
    expect(toLastPickTeam({ TeamCity: "Dallas", TeamLogo: "x.png", TeamName: "Cowboys" })).toEqual({
      TeamCity: "Dallas",
      TeamLogo: "x.png",
      TeamName: "Cowboys",
    });
  });

  it("returns undefined when any part is missing", () => {
    expect(toLastPickTeam({ TeamCity: null, TeamLogo: "x.png", TeamName: "Cowboys" })).toBeUndefined();
    expect(toLastPickTeam({ TeamCity: "Dallas", TeamLogo: null, TeamName: "Cowboys" })).toBeUndefined();
    expect(toLastPickTeam({ TeamCity: "Dallas", TeamLogo: "x.png", TeamName: null })).toBeUndefined();
  });
});

describe("isSurvivorComplete", () => {
  it("is complete with fewer than two survivors", () => {
    expect(isSurvivorComplete([])).toBe(true);
    expect(isSurvivorComplete([{ WeeksAlive: 3 }])).toBe(true);
  });

  it("is complete when the first survivor made it through the season", () => {
    expect(isSurvivorComplete([{ WeeksAlive: WEEKS_IN_SEASON }, { WeeksAlive: WEEKS_IN_SEASON }])).toBe(true);
  });

  it("is in progress with multiple survivors mid-season", () => {
    expect(isSurvivorComplete([{ WeeksAlive: 3 }, { WeeksAlive: 3 }])).toBe(false);
  });
});

describe("toMaxWeek", () => {
  it("defaults to 0", () => {
    expect(toMaxWeek(undefined)).toBe(0);
    expect(toMaxWeek({ max: null })).toBe(0);
  });

  it("returns the max", () => {
    expect(toMaxWeek({ max: 9 })).toBe(9);
  });
});

describe("deadCountSql", () => {
  const compile = (week: number, maxWeek: number) =>
    db
      .selectFrom("SurvivorMV")
      .select((eb) => eb.fn.sum<number>(deadCountSql(week, maxWeek)).as("deadCount"))
      .compile();

  it("counts eliminations in that week for past weeks", () => {
    const { parameters, sql } = compile(3, 5);

    expect(sql).toContain("WeeksAlive = ?");
    expect(parameters).toEqual([3]);
  });

  it("counts currently dead players for the latest week", () => {
    const { parameters, sql } = compile(5, 5);

    expect(sql).toContain("CurrentStatus = 'Dead'");
    expect(parameters).toEqual([]);
  });
});
