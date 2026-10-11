import { DummyDriver, Kysely, MysqlAdapter, MysqlIntrospector, MysqlQueryCompiler, sql } from "kysely";
import { describe, expect, it } from "vitest";

import type { DB } from "..";
import { upcomingSeasonOpenerQuery } from "./userHelpers";

const db = new Kysely<DB>({
  dialect: {
    createAdapter: () => new MysqlAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (kysely) => new MysqlIntrospector(kysely),
    createQueryCompiler: () => new MysqlQueryCompiler(),
  },
});

describe("upcomingSeasonOpenerQuery", () => {
  it("compiles to the SQL previously inlined in the survivor register/unregister mutations", () => {
    const legacy = db
      .selectFrom("Games")
      .select("GameID")
      .where("GameNumber", "=", 1)
      .where("GameWeek", "=", 1)
      .where("GameKickoff", ">", sql<Date>`CURRENT_TIMESTAMP`)
      .compile();
    const current = upcomingSeasonOpenerQuery(db).compile();

    expect(current.sql).toBe(legacy.sql);
    expect(current.parameters).toEqual(legacy.parameters);
  });
});
