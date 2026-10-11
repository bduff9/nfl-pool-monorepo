import { type } from "arktype";
import { DummyDriver, Kysely, MysqlAdapter, MysqlIntrospector, MysqlQueryCompiler } from "kysely";
import { describe, expect, it, vi } from "vitest";

import type { DB } from "..";
import { loadPrizes, systemValueQuery } from "./systemValueHelpers";

const db = new Kysely<DB>({
  dialect: {
    createAdapter: () => new MysqlAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (kysely) => new MysqlIntrospector(kysely),
    createQueryCompiler: () => new MysqlQueryCompiler(),
  },
});
const parseTriple = type("string.json.parse").to(["number", "number", "number"]);

describe("systemValueQuery", () => {
  it("compiles to the same SQL as the previously inlined query", () => {
    const legacy = db
      .selectFrom("SystemValues")
      .select("SystemValueValue")
      .where("SystemValueName", "=", "PoolCost")
      .compile();
    const current = systemValueQuery(db, "PoolCost").compile();

    expect(current.sql).toBe(legacy.sql);
    expect(current.parameters).toEqual(legacy.parameters);
  });
});

const executorReturning = (value: string): Pick<Kysely<DB>, "selectFrom"> =>
  ({
    selectFrom: () => ({
      select: () => ({
        where: () => ({ executeTakeFirst: () => Promise.resolve({ SystemValueValue: value }) }),
      }),
    }),
  }) as unknown as Pick<Kysely<DB>, "selectFrom">;

describe("loadPrizes", () => {
  it("returns the defaults when the system value is missing", async () => {
    await expect(loadPrizes(db, "WeeklyPrizes", "weekly", parseTriple, [0, 0, 0])).resolves.toEqual([0, 0, 0]);
  });

  it("returns the parsed tuple", async () => {
    await expect(
      loadPrizes(executorReturning("[1,2,3]"), "WeeklyPrizes", "weekly", parseTriple, [0, 0, 0]),
    ).resolves.toEqual([1, 2, 3]);
  });

  it("logs and throws a malformed-value error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(
      loadPrizes(executorReturning("[1,2]"), "WeeklyPrizes", "weekly", parseTriple, [0, 0, 0]),
    ).rejects.toThrow("Malformed WeeklyPrizes value in SystemValues: [1,2]");
    expect(spy).toHaveBeenCalledWith("Failed to parse weekly prize amounts", expect.anything(), "[1,2]");

    spy.mockRestore();
  });
});
