import type { DB } from "@nfl-pool-monorepo/db/src";
import { DummyDriver, Kysely, MysqlAdapter, MysqlIntrospector, MysqlQueryCompiler } from "kysely";
import { describe, expect, it } from "vitest";

import { userFilterPredicate } from "./userFilters";

const db = new Kysely<DB>({
  dialect: {
    createAdapter: () => new MysqlAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (kysely) => new MysqlIntrospector(kysely),
    createQueryCompiler: () => new MysqlQueryCompiler(),
  },
});

const compile = (filter: Parameters<typeof userFilterPredicate>[1]) =>
  db
    .selectFrom("Users as u")
    .select("u.UserID")
    .where((eb) => userFilterPredicate(eb, filter))
    .compile();

describe("userFilterPredicate", () => {
  it("filters on the registration status case expression", () => {
    const { parameters, sql } = compile({ id: "UserStatus2", value: "Inactive" });

    expect(sql).toContain("'Registered'");
    expect(sql).toContain("'Incomplete'");
    expect(parameters).toEqual(["Inactive"]);
  });

  it("filters on the rookie/veteran case expression", () => {
    const { parameters, sql } = compile({ id: "UserStatus3", value: "Rookie" });

    expect(sql).toContain("'Veteran'");
    expect(sql).toContain("`UserHistory`");
    expect(parameters).toEqual(["Rookie"]);
  });

  it("filters on negative payment balance with a numeric value", () => {
    const { parameters, sql } = compile({ id: "UserIsOwing", value: "1" });

    expect(sql).toContain("SUM(`p`.`PaymentAmount`)");
    expect(parameters).toEqual([1]);
  });
});
