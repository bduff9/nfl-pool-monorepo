import type { DB } from "@nfl-pool-monorepo/db/src";
import { DummyDriver, Kysely, MysqlAdapter, MysqlIntrospector, MysqlQueryCompiler, sql } from "kysely";
import { describe, expect, it } from "vitest";

import { unusedPicksCountQuery } from "./unusedPicksQuery";

const db = new Kysely<DB>({
  dialect: {
    createAdapter: () => new MysqlAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (kysely) => new MysqlIntrospector(kysely),
    createQueryCompiler: () => new MysqlQueryCompiler(),
  },
});

const legacyBase = () =>
  db
    .selectFrom("Picks as P")
    .select([sql<number>`COUNT(*)`.as("count")])
    .innerJoin("Games as G", "G.GameID", "P.GameID")
    .where("G.GameWeek", "=", 5)
    .where("P.UserID", "=", 9);

describe("unusedPicksCountQuery", () => {
  it("matches the previous SQL when no unused points are supplied", () => {
    const old = legacyBase().where("P.PickPoints", "is", null).compile();

    for (const unused of [undefined, []]) {
      const current = unusedPicksCountQuery(db, 9, 5, unused).compile();

      expect(current.sql).toBe(old.sql);
      expect(current.parameters).toEqual(old.parameters);
    }
  });

  it("matches the previous SQL when unused points are supplied", () => {
    const old = legacyBase().where("P.PickPoints", "in", [1, 2]).compile();
    const current = unusedPicksCountQuery(db, 9, 5, [1, 2]).compile();

    expect(current.sql).toBe(old.sql);
    expect(current.parameters).toEqual(old.parameters);
  });
});
