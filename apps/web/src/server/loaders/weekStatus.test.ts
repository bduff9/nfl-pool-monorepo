import type { DB } from "@nfl-pool-monorepo/db/src";
import { DummyDriver, Kysely, MysqlAdapter, MysqlIntrospector, MysqlQueryCompiler, sql } from "kysely";
import { describe, expect, it } from "vitest";

import { gameStatusCountsQuery, toSeasonStatus } from "./weekStatus";

const db = new Kysely<DB>({
  dialect: {
    createAdapter: () => new MysqlAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (kysely) => new MysqlIntrospector(kysely),
    createQueryCompiler: () => new MysqlQueryCompiler(),
  },
});

const legacy = () =>
  db
    .selectFrom("Games")
    .select([
      sql<number>`sum(case when GameStatus = 'Pregame' then 1 else 0 end)`.as("NotStarted"),
      sql<number>`sum(case when GameStatus = 'Final' then 1 else 0 end)`.as("Completed"),
      sql<number>`sum(case when GameStatus not in ('Pregame', 'Final') then 1 else 0 end)`.as("InProgress"),
    ]);

describe("gameStatusCountsQuery", () => {
  it("compiles to the same SQL as the previously inlined season query", () => {
    const current = gameStatusCountsQuery(db).compile();

    expect(current.sql).toBe(legacy().compile().sql);
    expect(current.parameters).toEqual([]);
  });

  it("compiles to the same SQL as the previously inlined week query", () => {
    const old = legacy().where("GameWeek", "=", 4).compile();
    const current = gameStatusCountsQuery(db).where("GameWeek", "=", 4).compile();

    expect(current.sql).toBe(old.sql);
    expect(current.parameters).toEqual(old.parameters);
  });
});

describe("toSeasonStatus", () => {
  it("is Not Started when nothing has finished or begun", () => {
    expect(toSeasonStatus({ Completed: 0, InProgress: 0, NotStarted: 16 })).toBe("Not Started");
  });

  it("is Complete when nothing is pending or in progress", () => {
    expect(toSeasonStatus({ Completed: 16, InProgress: 0, NotStarted: 0 })).toBe("Complete");
  });

  it("is In Progress otherwise, and coerces string sums from MySQL", () => {
    expect(toSeasonStatus({ Completed: 3, InProgress: 0, NotStarted: 13 })).toBe("In Progress");
    expect(toSeasonStatus({ Completed: "0", InProgress: "2", NotStarted: "0" } as unknown as never)).toBe(
      "In Progress",
    );
  });
});
