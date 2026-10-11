import { type } from "arktype";
import { describe, expect, it } from "vitest";

import { paginate, parseAdminTableParams } from "./admin-table-params";

const config = {
  defaultSort: [{ desc: true, id: "a" as const }],
  filterSchema: type({ id: type.enumerated("a"), value: "string" }).array(),
  sortSchema: type({ desc: "boolean", id: type.enumerated("a", "b") }).array(),
};

describe("parseAdminTableParams", () => {
  it("returns defaults when params are missing", () => {
    expect(parseAdminTableParams(undefined, config)).toEqual({
      filter: [],
      page: 1,
      pageSize: 10,
      sort: [{ desc: true, id: "a" }],
    });
  });

  it("parses sort, filter, page and pageSize", () => {
    const result = parseAdminTableParams(
      { filter: '[{"id":"a","value":"x"}]', page: "3", pageSize: "25", sort: '[{"desc":false,"id":"b"}]' },
      config,
    );

    expect(result).toEqual({
      filter: [{ id: "a", value: "x" }],
      page: 3,
      pageSize: 25,
      sort: [{ desc: false, id: "b" }],
    });
  });

  it("keeps 'all' page size", () => {
    expect(parseAdminTableParams({ pageSize: "all" }, config).pageSize).toBe("all");
  });

  it("caps numeric page size at maxPageSize", () => {
    expect(parseAdminTableParams({ pageSize: "500" }, { ...config, maxPageSize: 100 }).pageSize).toBe(100);
  });

  it("falls back to defaults for invalid JSON", () => {
    const result = parseAdminTableParams({ filter: "nope", sort: '[{"id":"zzz"}]' }, config);

    expect(result.filter).toEqual([]);
    expect(result.sort).toEqual([{ desc: true, id: "a" }]);
  });
});

describe("paginate", () => {
  const fakeQuery = () => {
    const calls: string[] = [];
    const query = {
      limit: (n: number) => {
        calls.push(`limit:${n}`);
        return query;
      },
      offset: (n: number) => {
        calls.push(`offset:${n}`);
        return query;
      },
    };

    return { calls, query };
  };

  it("applies limit and offset for a numeric page size", () => {
    const { calls, query } = fakeQuery();
    paginate(query, 3, 10);

    expect(calls).toEqual(["limit:10", "offset:20"]);
  });

  it("treats page below 1 as the first page", () => {
    const { calls, query } = fakeQuery();
    paginate(query, 0, 10);

    expect(calls).toEqual(["limit:10", "offset:0"]);
  });

  it("applies no limit for 'all' without allLimit", () => {
    const { calls, query } = fakeQuery();
    paginate(query, 1, "all");

    expect(calls).toEqual([]);
  });

  it("caps 'all' at allLimit", () => {
    const { calls, query } = fakeQuery();
    paginate(query, 2, "all", 200);

    expect(calls).toEqual(["limit:200", "offset:0"]);
  });
});
