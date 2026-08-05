import { vi } from "vitest";

const CHAIN_METHODS = [
  "selectFrom",
  "innerJoin",
  "leftJoin",
  "select",
  "where",
  "orderBy",
  "groupBy",
  "updateTable",
  "set",
  "insertInto",
  "values",
  "deleteFrom",
  "onConflict",
] as const;

type ChainMethod = (typeof CHAIN_METHODS)[number];

export type MockDb = Record<ChainMethod, ReturnType<typeof vi.fn>> & {
  execute: ReturnType<typeof vi.fn>;
  executeTakeFirst: ReturnType<typeof vi.fn>;
  executeTakeFirstOrThrow: ReturnType<typeof vi.fn>;
  transaction: ReturnType<typeof vi.fn>;
};

// Builds a fake Kysely query builder for use with vi.mock("../kysely", ...). Every chain method
// (selectFrom, where, set, ...) returns the same object so calls can be chained arbitrarily; only
// the terminal methods (execute/executeTakeFirst/executeTakeFirstOrThrow) produce real data, via
// mockResolvedValueOnce() configured per-test to match the call order the code under test makes.
// transaction().execute(callback) invokes callback with this same mock as `trx`.
export const createMockDb = (): MockDb => {
  const builder = {} as MockDb;

  for (const method of CHAIN_METHODS) {
    builder[method] = vi.fn(() => builder);
  }

  builder.execute = vi.fn();
  builder.executeTakeFirst = vi.fn();
  builder.executeTakeFirstOrThrow = vi.fn();
  builder.transaction = vi.fn(() => ({
    execute: vi.fn((callback: (trx: MockDb) => unknown) => callback(builder)),
  }));

  return builder;
};
