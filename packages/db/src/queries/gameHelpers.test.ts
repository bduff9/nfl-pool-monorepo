import { DummyDriver, Kysely, MysqlAdapter, MysqlIntrospector, MysqlQueryCompiler, sql } from "kysely";
import { describe, expect, it } from "vitest";

import type { DB } from "..";
import { unfinishedGamesQuery } from "./gameHelpers";

const db = new Kysely<DB>({
  dialect: {
    createAdapter: () => new MysqlAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (kysely) => new MysqlIntrospector(kysely),
    createQueryCompiler: () => new MysqlQueryCompiler(),
  },
});

describe("unfinishedGamesQuery", () => {
  it("compiles to the previous hasUnfinishedGames SQL", () => {
    const legacy = db
      .selectFrom("Games")
      .select("GameID")
      .where("GameWeek", "=", 3)
      .where("GameStatus", "<>", "Final")
      .compile();
    const current = unfinishedGamesQuery(db, 3).compile();

    expect(current.sql).toBe(legacy.sql);
    expect(current.parameters).toEqual(legacy.parameters);
  });

  it("compiles to the previous checkDBIfUpdatesNeeded SQL when kickoff is constrained", () => {
    const legacy = db
      .selectFrom("Games")
      .select("GameID")
      .where("GameWeek", "=", 3)
      .where("GameStatus", "<>", "Final")
      .where("GameKickoff", "<=", sql<Date>`CURRENT_TIMESTAMP`)
      .compile();
    const current = unfinishedGamesQuery(db, 3).where("GameKickoff", "<=", sql<Date>`CURRENT_TIMESTAMP`).compile();

    expect(current.sql).toBe(legacy.sql);
    expect(current.parameters).toEqual(legacy.parameters);
  });
});
